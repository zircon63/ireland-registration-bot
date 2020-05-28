import GameStats from 'game-stats';

export class Render {
    constructor(canvas,
                statsElement,
                webglRender) {
        this.webglRender = webglRender;
        this.canvas = canvas;
        this.statsElement = statsElement;
        this.context = canvas.getContext('2d');
        this.stats = new GameStats();
        this.video = null;
    }

    async getVideoInputs() {
        if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
            return [];
        }

        const devices = await navigator.mediaDevices.enumerateDevices();

        return devices.filter(
            device => device.kind === "videoinput"
        );
    }

    async initNet(worker) {
        return new Promise(resolve => {
            const initHandler = e => {
                if (e.data.event === 'init') {
                    worker.removeEventListener('message', initHandler);
                    resolve();
                }
            }
            worker.postMessage({
                event: 'init',
                width: this.video.width,
                height: this.video.height
            })
            worker.addEventListener('message', initHandler);
        });
    }

    async setupVideo() {
        return new Promise(resolve => {
            const video = document.createElement('video');
            navigator.mediaDevices.getUserMedia({
                video: true
            }).then(stream => {
                video.srcObject = stream;
                video.onloadedmetadata = () => {
                    video.width = video.videoWidth;
                    video.height = video.videoHeight;
                    this.canvas.width = video.videoWidth;
                    this.canvas.height = video.videoHeight;
                    resolve(video);
                };
            });
        });
    }

    async loadImage() {
        return new Promise(resolve => {
            const image = new Image();
            image.onload = () => {
                resolve(image);
            }
            image.src = './bg.jpg';
        });
    }

    async bootstrap() {
        const video = await this.setupVideo();
        video.play();
        this.video = video;
        await this.getVideoInputs();
        const worker = new Worker('./dist/worker.bundle.js');
        await this.initNet(worker);
        const bg = await this.loadImage();
        this.webglRender.init(video.width, video.height);
        worker.addEventListener('message', (e) => {
            const {event, segmentation} = e.data;
            if (event === 'draw') {
                const image = new ImageData(segmentation, this.canvas.width, this.canvas.height);
                this.webglRender.render(this.video, image, bg);
                requestAnimationFrame(draw);
            }

        })
        const draw = async (timestamp) => {
            this.context.drawImage(video, 0, 0);
            const pixels = this.context.getImageData(0, 0, this.canvas.width, this.canvas.height);
            worker.postMessage({
                event: 'frame',
                pixels
            }, [pixels.data.buffer]);
            this.stats.record(timestamp);
            this.showFps();
        }

        draw();
    }

    showFps() {
        const {
            fps,
            fpsAverage
        } = this.stats.stats();
        this.statsElement.innerHTML = `FPS: ${fps}, AVG: ${fpsAverage}`;
    }
}
