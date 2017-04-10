function ($q) {
    
    navigator.getUserMedia  = navigator.getUserMedia ||
        navigator.webkitGetUserMedia ||
        navigator.mozGetUserMedia ||
        navigator.msGetUserMedia;
          
    //Constructor
    var AudioRecorder = function() {
        if(!navigator || !navigator.getUserMedia) {
            throw new Error('missing navigator.getUserMedia');
        }
        
        var THIS = this;
        var processorBufferSize = 1024; //valid values: 256, 512, 1024, 2048, 4096, 8192, 16384
        
        var audioContext = this.audioContext = new AudioContext();
        var recorderNode = this.recorderNode = audioContext.createScriptProcessor(processorBufferSize, 1, 1);
        this.recBuffer = [];
        
        recorderNode.onaudioprocess = function(audioProcessingEvent) {
            
            var inputBuffer = audioProcessingEvent.inputBuffer;
            
            var inputData = inputBuffer.getChannelData(0);
            
            console.log('processing', inputBuffer.length);
            
            // Loop through the samples in input bffer; push into recorder buffer
            for (var sample = 0; sample < inputBuffer.length; sample++) {
                THIS.recBuffer.push(inputData[sample]);
            }
            
        };
    };
    
    /**
     * Start recording from navigator.getUserMedia
     * @return promise fulfilled when recording begins
     */
    AudioRecorder.prototype.record = function() {
        var deferred = $q.defer();
        var THIS = this;
        
        navigator.getUserMedia({audio: true}, 
            function(stream) {
                // Create an AudioNode from the stream.
                THIS.audioSource = THIS.audioContext.createMediaStreamSource(stream);
                
                //connect it to our recorderNode
                THIS.audioSource.connect(THIS.recorderNode);
                THIS.recorderNode.connect(THIS.audioContext.destination); //needed to work in chromium
                
                deferred.resolve(THIS.audioSource);
            },
            
            function(err) {
                console.error('AudioRecorder.record', err);
                deferred.reject(err);
            }
        );
        
        return deferred.promise;
    };
    
    AudioRecorder.prototype.stop = function() {
        //disconnect audioSource (connected to user's mic via getUserMedia) from our recorderNode
        this.audioSource.disconnect(this.recorderNode);
        this.recorderNode.disconnect(this.audioContext.destination);
    };
    
    AudioRecorder.prototype.play = function() {
        
        var audioContext = this.audioContext;
        var recBuffer = this.recBuffer;
        
        var sampleCount = recBuffer.length;
        
        
        //Create an AudioBuffer to wrap our raw data buffer
        var aBuffer = audioContext.createBuffer(1, sampleCount, audioContext.sampleRate);
        
        // feed recBuffer data into bufferNode
        var channelData = aBuffer.getChannelData(0);
        for (var i = 0; i < sampleCount; i++) {
            channelData[i] = recBuffer[i];
        }
        
        
        //Create a source node that draws from the AudioBuffer
        var recordedSource = audioContext.createBufferSource(); 
        recordedSource.buffer = aBuffer;                    // tell the source which sound to play
        recordedSource.connect(audioContext.destination);       // connect the source to the context's destination (the speakers)
        recordedSource.start(0); 
        
        var deferred = $q.defer();
        recordedSource.onended  = function() {
            deferred.resolve(recordedSource);
        };
        return deferred.promise;
    };
    
    
    AudioRecorder.prototype.clearBuffer = function() {
        this.recBuffer = [];
    };
    
    AudioRecorder.prototype.exportWav = function() {
        var dataview = AudioRecorder.encodeWAV(this.recBuffer, true, this.audioContext.sampleRate);
        var audioBlob = new Blob([dataview], { type: 'audio/wav' });
        return audioBlob;
    };
    
    
    // thanks to Matt Diamond (https://webaudiodemos.appspot.com/AudioRecorder)
    var writeString = function(view, offset, string) {
        for (var i = 0; i < string.length; i++){
            view.setUint8(offset + i, string.charCodeAt(i));
        }
    };
    
    var floatTo16BitPCM = function(output, offset, input) {
        for (var i = 0; i < input.length; i++, offset+=2){
            var s = Math.max(-1, Math.min(1, input[i]));
            output.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
        }
    };
    
    AudioRecorder.encodeWAV = function(samples, mono, sampleRate) {
        var buffer = new ArrayBuffer(44 + samples.length * 2);
        
        var view = new DataView(buffer);
        
        writeString(view, 0, 'RIFF');                       // RIFF identifier 
        view.setUint32(4, 32 + samples.length * 2, true);   // file length
        writeString(view, 8, 'WAVE');                       // RIFF type
        writeString(view, 12, 'fmt ');                      //format chunk identifier
        view.setUint32(16, 16, true);                       //format chunk length
        view.setUint16(20, 1, true);                        //sample format (raw)
        view.setUint16(22, mono?1:2, true);                 //channel count
        view.setUint32(24, sampleRate, true);               //sample rate
        view.setUint32(28, sampleRate * 4, true);           //byte rate (sample rate * block align)
        view.setUint16(32, 4, true);                        //block align (channel count * bytes per sample)
        view.setUint16(34, 16, true);                       //bits per sample
        writeString(view, 36, 'data');                      // data chunk identifier
        view.setUint32(40, samples.length * 2, true);       // data chunk length
        
        
        floatTo16BitPCM(view, 44, samples);

        return view;
    };
    
    
    return AudioRecorder;
}