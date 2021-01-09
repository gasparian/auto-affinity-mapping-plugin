export function sortObjectByValueLen(widgetClass) {
    // descending sort by cluster length
    return Object.keys(widgetClass)
                 .map((k) => { return { key: k, value: widgetClass[k] } })
                 .sort((a, b) => { return (a.value.length > b.value.length || a.key == -1) ? -1 : 1 })
    
}