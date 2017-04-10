function ($scope, AudioPlayer) {
    
    // var recorder = new AudioRecorder();
    var player; 
    
    $scope.play = function() {
        player = player || new AudioPlayer(false); //non-caching
        var attId = $scope.displayValue.attachment_id;
        $scope.playing=true;
        player.playUrl('attachment_ws/download/'+attId).then(function(src) {
            $scope.playing = false;
        });
    };
    
    $scope.stop = function() {
        player.stopPlayback();
        $scope.playing = false;
    };

  }