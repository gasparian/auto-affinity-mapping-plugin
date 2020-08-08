 https://gasparian.github.io/neural-affinity-mapping-plugin/  

# Neural affinity mapping  

Miro plugin for widgets tex-based clustering.  
Encode widgets' text --> apply clustering --> visualize.  

Short recipe:  
 - take pre-trained BERT;  
 - take some non-linear dimension reduction algorithm (tSNE / UMAP);  
 - choose the clustering algorithm (KMeans / DBSCAN);  

 WHILE (you're not satisfied with clustering results)  

 DO  
    - get some test data;  
    - test algorithm to optimize clustering parameters on the fly;  

 FI  

 - get real data from the client;  
 - return clusters ids back;  

[Link](https://miro.com/oauth/authorize/?response_type=token&client_id=3074457349195679315&redirect_uri=https://miro.com/app/dashboard/) to authorize the plugin.  
