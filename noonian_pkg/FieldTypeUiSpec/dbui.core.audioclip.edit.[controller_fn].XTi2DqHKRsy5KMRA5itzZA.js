function ($scope, AudioRecorder, AudioPlayer, $http) {
    
    var recorder;
    var player; //lazy init
    
    var inBuffer = false;
    
    $scope.$watch('binding.value', function(b) {
        console.log('audioclip editor: binding', b);
    });
 
    
    $scope.startRecording = function() {
        recorder = recorder || new AudioRecorder();
        
        recorder.clearBuffer();
        recorder.record().then(function() {
            $scope.recording=true;
        });
    };
    
    $scope.stopRecording = function() {
        recorder.stop();
        $scope.recording=false;
        inBuffer = true;
        
        var audioBlob = recorder.exportWav();
        $scope.uploadFile(audioBlob, 'recordedsample.wav');
        
    };
    
    $scope.play = function() {
        $scope.playing = true;
        var finishPlayPromise;
        if(inBuffer) {
            finishPlayPromise = recorder.play();
        }
        else {
            player = player || new AudioPlayer(false); //non-caching
            var attId = $scope.binding.value.attachment_id;
            finishPlayPromise = player.playUrl('attachment_ws/download/'+attId);
        }
        finishPlayPromise.then(function() {
            $scope.playing = false;
        });
    };


    $scope.clear = function() {
      $scope.binding.value = null;
    }
    
    $scope.uploadFile = function(fileObj, fileName) {
        var metaObj = {
          filename:fileName,
          size:fileObj.size,
          type:fileObj.type
        };

        var fd = new FormData();
        fd.append('metadata', JSON.stringify(metaObj));
        fd.append('file', fileObj);

        var httpConfig = {
          transformRequest: angular.identity,
          headers: {'Content-Type': undefined}
        };

        $scope.uploading = true;
        $http.post('attachment_ws/upload', fd, httpConfig)
        .then(function(result) {
        //   console.log('upload complete',result)
          $scope.uploading = false;
          $scope.binding.value = result.data.result;
        },
        function(err) {
          console.log(err);
        });
    };


  }