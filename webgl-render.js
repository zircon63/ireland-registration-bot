import {initShaders} from "./webgl.utils";

export class WebglRender {
    constructor(canvas) {
        this.canvas = canvas;
        this.context = canvas.getContext('webgl', {
            depth: false,
            stencil: false,
            alpha: false,
            premultipliedAlpha: false,
            antialias: false
        });
    }

    render(video, segmentation, bg) {
        // Specify the color for clearing <canvas>
        this.context.clearColor(0.0, 0.0, 0.0, 1.0);

        this.loadTexture(video, segmentation, bg);
    }

    init(width, height) {
        // Get shader elements
        this.videoDimension = {
            width,
            height
        };
        this.canvas.width = width;
        this.canvas.height = height;
        const vShaderElement = document.getElementById("VertexShader");
        const fShaderElement = document.getElementById("FragmentShader");
        if (vShaderElement == null) {
            console.log("Failed to get the vertex shader element");
            return;
        }
        if (fShaderElement == null) {
            console.log("Failed to get the fragment shader element");
            return;
        }

        // Get shader sources
        const vShaderSource = vShaderElement.firstChild.textContent;
        const fShaderSource = fShaderElement.firstChild.textContent;

        // Initialize shaders
        if (!initShaders(this.context, vShaderSource, fShaderSource)) {
            console.log('Failed to intialize shaders.');
            return;
        }
        this.initVertexBuffers();
        this.initTextures();
    }

    initVertexBuffers() {
        const verticesTexCoords = new Float32Array([
            -1.0, 1.0, 0.0, 1.0,
            -1.0, -1.0, 0.0, 0.0,
            1.0, 1.0, 1.0, 1.0,
            1.0, -1.0, 1.0, 0.0,
        ]);

        // Create the buffer object
        const vertexTexCoordBuffer = this.context.createBuffer();
        if (!vertexTexCoordBuffer) {
            console.log('Failed to create the buffer object');
            return -1;
        }

        // Bind the buffer object to target
        this.context.bindBuffer(this.context.ARRAY_BUFFER, vertexTexCoordBuffer);
        this.context.bufferData(this.context.ARRAY_BUFFER, verticesTexCoords, this.context.STATIC_DRAW);

        const FSIZE = verticesTexCoords.BYTES_PER_ELEMENT;
        //Get the storage location of a_Position, assign and enable buffer
        const a_Position = this.context.getAttribLocation(this.context.program, 'a_Position');
        if (a_Position < 0) {
            console.log('Failed to get the storage location of a_Position');
            return -1;
        }
        this.context.vertexAttribPointer(a_Position, 2, this.context.FLOAT, false, FSIZE * 4, 0);
        this.context.enableVertexAttribArray(a_Position);  // Enable the assignment of the buffer object
    }

    initTextures() {
        const texture = this.context.createTexture();
        const maskTexture = this.context.createTexture();
        const backgroundTexture = this.context.createTexture();
        const u_Sampler = this.context.getUniformLocation(this.context.program, 'u_Sampler');
        const u_Mask = this.context.getUniformLocation(this.context.program, 'u_Mask');
        const u_Background = this.context.getUniformLocation(this.context.program, 'u_Background');
        const iResolution = this.context.getUniformLocation(this.context.program, 'iResolution');
        this.videoInput = {
            texture,
            maskTexture,
            backgroundTexture,
            u_Sampler,
            u_Mask,
            u_Background,
            iResolution
        };
    }

    setupTexture(unit, texture) {
        this.context.activeTexture(unit);
        // Bind the texture object to the target
        this.context.bindTexture(this.context.TEXTURE_2D, texture);

        // Set the texture parameters
        this.context.texParameteri(this.context.TEXTURE_2D, this.context.TEXTURE_WRAP_S, this.context.CLAMP_TO_EDGE);
        this.context.texParameteri(this.context.TEXTURE_2D, this.context.TEXTURE_WRAP_T, this.context.CLAMP_TO_EDGE);

        this.context.texParameteri(this.context.TEXTURE_2D, this.context.TEXTURE_MIN_FILTER, this.context.LINEAR);
        this.context.texParameteri(this.context.TEXTURE_2D, this.context.TEXTURE_MAG_FILTER, this.context.LINEAR);
    }

    loadTexture(video, segmentation, background) {
        this.context.pixelStorei(this.context.UNPACK_FLIP_Y_WEBGL, 1); // Flip the image's y axis
        this.setupTexture(this.context.TEXTURE0, this.videoInput.texture);
        this.context.texImage2D(this.context.TEXTURE_2D, 0, this.context.RGBA, this.context.RGBA, this.context.UNSIGNED_BYTE, video);
        this.setupTexture(this.context.TEXTURE1, this.videoInput.maskTexture);
        this.context.texImage2D(this.context.TEXTURE_2D, 0, this.context.RGBA, this.context.RGBA, this.context.UNSIGNED_BYTE, segmentation);
        this.setupTexture(this.context.TEXTURE2, this.videoInput.backgroundTexture);
        this.context.texImage2D(this.context.TEXTURE_2D, 0, this.context.RGB, this.context.RGB, this.context.UNSIGNED_BYTE, background);
        // Set the texture unit 0 to the sampler
        this.context.uniform1i(this.videoInput.u_Sampler, 0);
        this.context.uniform1i(this.videoInput.u_Mask, 1);
        this.context.uniform1i(this.videoInput.u_Background, 2);
        this.context.uniform3f(this.videoInput.iResolution, this.videoDimension.width, this.videoDimension.height, 0.0);

        this.context.clear(this.context.COLOR_BUFFER_BIT);   // Clear <canvas>

        this.context.drawArrays(this.context.TRIANGLE_STRIP, 0, 4); // Draw the rectangle
    }

}




