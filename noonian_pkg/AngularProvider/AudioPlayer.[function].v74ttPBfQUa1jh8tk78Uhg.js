function ($q) {
    

    
    
    var AudioPlayer = function(retainCache) {
        if(retainCache) {
            this.bufferCache = true;
        }
        
        this.audioContext = new AudioContext();
    };
    
    
    AudioPlayer.prototype.playBuffer = function(buffer) {
        
        var source = this.currSrc = this.audioContext.createBufferSource();
        source.buffer = buffer;
        source.connect(this.audioContext.destination);
        source.start(0);                           
        
        // note: on older systems, may have to use deprecated noteOn(time);
        
        var deferred = $q.defer();
        source.onended  = function() {
            deferred.resolve(source);
        };
        return deferred.promise;
    };
    
    
    AudioPlayer.prototype.playUrl = function(link) {
        var THIS = this;
        var cache = this.bufferCache;
        
        if(cache && cache[link]) {
            console.log(link+' is buffered');
            return this.playBuffer(cache[link]);
        }
        
        var request = new XMLHttpRequest();
        request.open('GET', link, true);
        request.responseType = 'arraybuffer';
        
        var deferred = $q.defer();
        // Decode asynchronously
        request.onload = function() {
            console.log('response for '+link, request.response.byteLength);
            
            THIS.audioContext.decodeAudioData(request.response, function(buffer) {
                
                if(cache) {
                    cache[link] = buffer;
                }
                deferred.resolve(THIS.playBuffer(buffer));
            }, function(err) {
                console.error(err);
                deferred.reject(err);
            });
        }
        request.send();
        return deferred.promise;
    };
    
    AudioPlayer.prototype.stopPlayback = function() {
        this.currSrc.disconnect(this.audioContext.destination);
    };
    
    
    return AudioPlayer;
}