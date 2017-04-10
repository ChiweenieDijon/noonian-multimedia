function (scope, iElement, iAttributes) {
    
    console.log('audioclip editor', scope, iElement, iAttributes);
    
    var fileInputElem = iElement.find('input.file_input');
    
    
    scope.initiateUpload = function() {
        // console.log(fileInputElem);
        fileInputElem.click();
    };
    
    
    fileInputElem.bind('change', function() {
        scope.$apply(function() {
            //A file has been selected
            var file = fileInputElem[0].files[0];
            scope.uploadFile(file, file.name);
        });
    });
    return true;
}