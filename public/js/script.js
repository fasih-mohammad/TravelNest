(() => {
    'use strict'
  
    // Fetch all the forms we want to apply custom Bootstrap validation styles to
    const forms = document.querySelectorAll('.needs-validation')
  
    // Loop over them and prevent submission
    Array.from(forms).forEach(form => {
      form.addEventListener('submit', event => {
        if (!form.checkValidity()) {
          event.preventDefault()
          event.stopPropagation()
        }
        form.classList.add('was-validated')
      }, false);
    });
  })();


document.addEventListener('DOMContentLoaded', () => {
var uploadField = document.getElementById("file");

if (uploadField) {
uploadField.onchange = function() {
    if(this.files[0].size > 2200000){
       alert("File is too big!");
       this.value = "";
    }
    };
  }
});
