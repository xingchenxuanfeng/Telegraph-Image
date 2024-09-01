import { errorHandling, telemetryData } from "./utils/middleware";
export async function onRequestPost(context) {  // Contents of context object  
    const {
        request, // same as existing Worker API    
        env, // same as existing Worker API    
        params, // if filename includes [id] or [[path]]   
        waitUntil, // same as ctx.waitUntil in existing Worker API    
        next, // used for middleware or to fetch assets    
        data, // arbitrary space for passing data between middlewares 
    } = context;
    const clonedRequest = request.clone();
    await errorHandling(context);
    telemetryData(context);
    const url = new URL(clonedRequest.url);
    const response = await fetch('https://telegra.ph/' + url.pathname + url.search, {
        method: clonedRequest.method,
        headers: clonedRequest.headers,
        body: clonedRequest.body,
    });

    try {
        const clonedRes = await response.clone().json(); // 等待响应克隆和解析完成
        const time = new Date().getTime();
        const src = clonedRes[0].src;
        const id = src.split('/').pop();
        const img_url = env.img_url;
        const apikey = env.ModerateContentApiKey;

        if (img_url == undefined || img_url == null || img_url == "") {
            // img_url 未定义或为空的处理逻辑
        } else {
            if (apikey == undefined || apikey == null || apikey == "") {
                await env.img_url.put(id, "", {
                    metadata: { ListType: "None", Label: "None", TimeStamp: time },
                });
            } else {
                try {
                    const fetchResponse = await fetch(`https://api.moderatecontent.com/moderate/?key=${apikey}&url=https://telegra.ph/${src}`);
                    if (!fetchResponse.ok) {
                        throw new Error(`HTTP error! status: ${fetchResponse.status}`);
                    }
                    const moderate_data = await fetchResponse.json();
                    await env.img_url.put(id, "", {
                        metadata: { ListType: "None", Label: moderate_data.rating_label, TimeStamp: time },
                    });
                } catch (error) {
                    console.error('Moderate Error:', error);
                } finally {
                    console.log('Moderate Done');
                }
            }
        }
    } catch (error) {
        console.error('Error:', error);
    } finally {
        return response;
    }
}
