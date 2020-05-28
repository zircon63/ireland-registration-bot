import {Render} from "./render";
import {WebglRender} from "./webgl-render";

const webglRender = new WebglRender(document.getElementById('webgl'));
const render = new Render(
    document.getElementById('chromakey'),
    document.getElementById('stats'),
    webglRender
);


render.bootstrap();

