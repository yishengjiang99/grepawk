function handleFiles(){
  const file = this.files[0];
  const objectURL = window.URL.createObjectURL(file);
   file.text().then(alert);
}

const VfsClient = {
  uploader: function(input_id){
    const inputElement = document.getElementById(input_id);
    inputElement.addEventListener("change", handleFiles, false);
  
  }
  
}
