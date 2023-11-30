import {initLinks} from '../preloadLinkIntegration.mjs';


let map = null;

const getLinkHeader = (path) => {

    for (let pattern in map) {

        if (new RegExp(pattern).test(path)) {
            return map[pattern];
        }
    }

    return '';

}



export async  function onRequest(context, next) {
    // intercept response data from a request
    // optionally, transform the response by modifying `locals`


    const response =  await next();

    if (!map) {
        map =  await initLinks();
    }

    const linkHeader = getLinkHeader(context.url.pathname);

    if (linkHeader) {

        return new Response(response.body, {
            status: response.status,
            headers: {...response.headers, link: linkHeader }
        });
    } else {

        return new Response(response.body, {
            status: response.status,
            headers: response.headers
        });
    }

}