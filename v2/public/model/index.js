$(document).ready(function(){
    var Messagebuttons = Array.prototype.slice.call(document.querySelectorAll(".toMessage")),
        receiver = document.querySelector("#receiver");
    
    
    Messagebuttons.forEach(function(element) {
        element.addEventListener("click", function() {
            receiver.value = element.parentElement.previousElementSibling.innerText;
        });
    });
});