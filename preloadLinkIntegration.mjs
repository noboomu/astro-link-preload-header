import {writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {readFileSync} from 'node:fs';

const DATA_FILE_NAME = '.preload_data.json';


export const initLinks = async () => {

    let linkRegexMap = {};

    try {

        let inFile = fileURLToPath(new URL('../dist/' + DATA_FILE_NAME, import.meta.url));

        if (inFile.includes('dist/dist')) {
            // this should not be required
            inFile = fileURLToPath(new URL('../' + DATA_FILE_NAME, import.meta.url));
        }

        const data = readFileSync(inFile);

        const linkData = JSON.parse(data);

        for (let route in linkData) {

            const {links, pattern} = linkData[route];

            const {styles, scripts} = links;

            linkRegexMap[pattern] = Array.from([...styles, ...scripts])

                .map((s) => {
                    // these could be improved, this is based on what I have working on other sites
                    return s.includes('css') ? `<${s}>;rel="preload";as="style";` : `<${s}>;rel="modulepreload";crossorigin="anonymous"`;
                }).join(",");

        }

    } catch (e) {

        // again, this could be a better experience
        console.error('No preload data found. Please run astro build first.');
    }

    return linkRegexMap;

}


export default function preloadLinks() {

    /**
     * Tracks the current route data, so we can use it to determine which scripts/styles to preload.
     */


    let allRoutes = [];

    let routeToLinkData = {};

    return {
        name: 'preloadLinks',
        hooks: {

            'astro:config:setup': ({addMiddleware}) => {

                addMiddleware({
                    entrypoint: './runtime/modulepreloader/index.js',
                    order: 'pre'
                });
            },

            'astro:build:ssr': ({manifest, entryPoints, middlewareEntryPoint}) => {

                allRoutes = manifest.routes;

                allRoutes.filter(r => r.routeData.type === 'page').forEach((r => {

                    let links = {};

                    links['styles'] = r.styles.filter(s => s.type === 'external').map((s) => s.src);
                    links['scripts'] = r.scripts.filter(s => s.type === 'external').map((s) => s.value);

                    routeToLinkData[r.routeData.route] = {
                        links,
                        pattern: r.routeData.pattern
                    };
                }))

            },

            'astro:build:done': async ({dir, routes}) => {

                const outFile = fileURLToPath(new URL('../' + DATA_FILE_NAME, dir));
                await writeFile(outFile, JSON.stringify(routeToLinkData, null, 2));

            }
        }
    }

}