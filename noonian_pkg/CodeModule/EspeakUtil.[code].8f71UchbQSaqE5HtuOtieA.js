function (db, nodeRequire, Q) {
    
    var GridFsService = db._svc.GridFsService;
    var spawn = nodeRequire('child_process').spawn;
    var fs = nodeRequire('fs');
        
    var exports = {};
    
    exports.speakToFile = function(toSay) {
        var wavFilename = 'tts_'+Date.now()+'.wav';
        var wavPath = '/tmp/'+wavFilename;
        
        var deferred = Q.defer();
        
        var espeak = spawn('espeak', ['-ven-us+f2', '-s120', '-w'+wavPath, '--stdin']);
        espeak.stdin.end(toSay);
        
        espeak.on('close', function(code) {
            console.log('espeak exit code %s', code);
            fs.stat(wavPath, function(err, stats) {
                if(err) {
                    deferred.reject(err); 
                    
                    return console.error('FAILED TO GENERATE TTS - couldnt open wav file -  %j', err);
                }
                
                var metaObj = {
                  filename:wavFilename,
                  size:stats.size,
                  type:'audio/wav'
                };
                    
                var fromFile = fs.createReadStream(wavPath);
                GridFsService.saveFile(fromFile, metaObj).then(function(fileId) {
                    metaObj.attachment_id = fileId;
                    deferred.resolve(metaObj);
                },
                function(err) {
                    console.error('FAILED TO GENERATE TTS - failure saving attachment - %j', err);
                    deferred.reject(err);
                })
                
            });
            
        });
        
        return deferred.promise;
    }
    
    return exports;
}