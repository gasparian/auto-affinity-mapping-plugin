import {sortObjectByValueLen} from "./helpers.js"

export default class WidgetsProcessor {
    constructor(apiUrl) {
        this.apiUrl = apiUrl
        this.serviceColor = '#f5f6f8'
        this.basicColors = [
            '#fff9b1', // Default color
            '#f5d128',
            '#d0e17a',
            '#d5f692',
            '#a6ccf5',
            '#67c6c0',
            '#23bfe7',
            '#ff9d48',
            '#ea94bb',
            '#f16c7f',
            '#b384bb',
        ]
        this.widgetsBufferCoef = 0.1
        this.heightBufferMultiplier = 2
        this.viewportData = {}
    }

    preprocessWidgets(widgets) {
        const processedWidgets = {
            initX: widgets[0].x,
            initY: widgets[0].y,
            maxX: widgets[0].x,
            maxY: widgets[0].y,
            widgetMeanWidth: 0,
            widgetMeanHeight: 0,
            widgets: {}
        }
        widgets.forEach(w => {
            if (!w.plainText.length) {
                return
            }
            if (w.x < processedWidgets.initX) {
                processedWidgets.initX = w.x
            }
            if (w.y < processedWidgets.initY) {
                processedWidgets.initY = w.y
            }
            if (w.x > processedWidgets.maxX) {
                processedWidgets.maxX = w.x
            }
            if (w.y > processedWidgets.maxY) {
                processedWidgets.maxY = w.y
            }
            processedWidgets.widgetMeanWidth += w.bounds.width / widgets.length
            processedWidgets.widgetMeanHeight += w.bounds.height / widgets.length
            processedWidgets.widgets[w.id] = {
                "plainText": w.plainText, 
                "x": w.x, "y": w.y,
                "width": w.bounds.width,
                "height": w.bounds.height,
                "scale": w.scale
            }
        })
        processedWidgets.selectionWidth = processedWidgets.maxX - processedWidgets.initX
        processedWidgets.selectionHeight = processedWidgets.maxY - processedWidgets.initY

        this.viewportData = {
            x: processedWidgets.initX - processedWidgets.selectionWidth / 2,
            y: processedWidgets.initY + processedWidgets.selectionHeight * this.heightBufferMultiplier,
            width: processedWidgets.selectionWidth * 2,
            height: processedWidgets.selectionHeight * 2,
        }
        
        return processedWidgets
    }

    get lastViewportData() {
        return this.viewportData
    }

    async getClusters(widgets) {
        let resp = await fetch(this.apiUrl, {
            method: "POST",
            cache: 'no-cache',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(widgets)
        })
        return resp.text()
    }

    process(widgets) {
        this.viewportData = {}
        const processedWidgets = this.preprocessWidgets(widgets)
        this.getClusters(processedWidgets.widgets).then((result) => {
            const response = result ? JSON.parse(result) : {}
            if (Object.keys(response).length && response["status"] == "success") {
                this.updateWidgetsPos(processedWidgets, response["result"])
            } else if (response["status"] == "failed") {
                console.error(response["result"])
            }
        })
    }

    increaseHeight(heightAcum, maxHeightRow) {
        return heightAcum + maxHeightRow * (1 + this.widgetsBufferCoef)
    }
    
    increaseWidth(widthAcum, w) {
        return widthAcum + w * (1 + this.widgetsBufferCoef)
    }

    getRandomColor() {
        const idx = Math.floor(Math.random() * this.basicColors.length)
        return this.basicColors[idx]
    }

    updateWidgetsPos(processedWidgets, responseData) { 
        const {titles, labels} = responseData 
        const sortedClasses = sortObjectByValueLen(labels)
        // calc position and create widgets
        let heightAcum = processedWidgets.initY + processedWidgets.selectionHeight * this.heightBufferMultiplier
        let prevColor = null
        let newWidgets = []
        sortedClasses.forEach((cls) => {
            let widthAcum = processedWidgets.initX
            let maxHeightRow = 0
            let clusterColor = this.getRandomColor()
            if (cls.key == -1) {
                // white color for outliers class
                clusterColor = this.serviceColor
            } else {
                while (clusterColor == prevColor) {
                    clusterColor = this.getRandomColor()
                }
            }
            // add first stickie which represents the cluster title
            cls.value.unshift(cls.key)
            const firstWidget = processedWidgets.widgets[Object.keys(processedWidgets.widgets)[0]]
            processedWidgets.widgets[cls.key] = {
                plainText: titles[cls.key],
                width: firstWidget.width,
                height: firstWidget.height,
                scale: firstWidget.scale
            }
            prevColor = clusterColor
            cls.value.forEach((v) => {
                // smth similar to pagination inside a cluster
                if ( widthAcum > (processedWidgets.maxX + processedWidgets.widgets[v].width / 2) ) {
                    widthAcum = processedWidgets.initX
                    heightAcum = this.increaseHeight(heightAcum, maxHeightRow)
                }
                const w = processedWidgets.widgets[v].width
                const h = processedWidgets.widgets[v].height
                if (h > maxHeightRow) {
                    maxHeightRow = h
                }
                // copy widgets to another place of the current board
                newWidgets.push({
                    type: 'sticker', text: processedWidgets.widgets[v].plainText,
                    id: v, x: widthAcum, y: heightAcum, 
                    scale: processedWidgets.widgets[v].scale,
                    style:{
                        stickerBackgroundColor: v == cls.key ? this.serviceColor : clusterColor
                    }
                })
                widthAcum = this.increaseWidth(widthAcum, w)
            })
            heightAcum = this.increaseHeight(heightAcum, maxHeightRow)
        })
        miro.board.widgets.create(newWidgets)
    }
}
