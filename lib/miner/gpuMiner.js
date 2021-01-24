const GPU = require("gpu.js").GPU;

class GPUMiner {
    constructor() {
        try {
            this.gpu = new GPU({ mode: "gpu" });
        } catch {
            console.warn("No GPU support. Fallback to CPU.");
            this.gpu = new GPU();
        }
        
        
    }
}

new GPUMiner();