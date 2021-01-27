Date.prototype.getUTCTime = function(){ 
    return this.getTime() + (this.getTimezoneOffset() * 1000); 
};