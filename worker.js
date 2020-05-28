import * as tf from '@tensorflow/tfjs';
import * as bodyPix from '@tensorflow-models/body-pix';

tf.setBackend('webgl');
const data = {
    net_configs: {
        architecture: 'MobileNetV1',
        outputStride: 8,
        multiplier: 0.5,
        quantBytes: 2
    }
}

self.onmessage = async ({data}) => {
    switch (data.event) {
        case "init":
            self.video = {
                width: data.width,
                height: data.height,
                size: data.width * data.height * 4
            };
            break;
        case "frame":
            const segmentation = await self.net.segmentPerson(data.pixels, {
                flipHorizontal: true,
                internalResolution: 0.25,
                segmentationThreshold: 0.3,
                maxDetections: 1
            });
            const mask = createImage(segmentation.data, self.video.width, self.video.height, self.video.size);
            postMessage({
                event: 'draw',
                segmentation: mask
            }, [mask.buffer]);
            break;
    }
}

function createImage(data, width, height, size) {
    const background = {
        r: 0,
        g: 0,
        b: 0,
        a: 0
    };
    const foreground = {
        r: 255,
        g: 0,
        b: 0,
        a: 255
    };
    const bytes = new Uint8ClampedArray(size);
    for (let i = 0; i < height; i++) {
        for (let j = 0; j < width; j++) {
            const n = i * width + j;
            const pixel = data[n];
            bytes[4 * n] = background.r;
            bytes[4 * n + 1] = background.g;
            bytes[4 * n + 2] = background.b;
            bytes[4 * n + 3] = background.a;
            if (pixel === 1) {
                bytes[4 * n] = foreground.r;
                bytes[4 * n + 1] = foreground.g;
                bytes[4 * n + 2] = foreground.b;
                bytes[4 * n + 3] = foreground.a;
            }
        }
    }
    return bytes;
}

async function load() {
    self.net = await bodyPix.load(data.net_configs);
    postMessage({
        event: 'init'
    })
}

load();
