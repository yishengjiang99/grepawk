$(document).ready(onPageReady);

var onPageReady = async function(){
    $(".window").click(function(e){
        alert("hi");
    });
    $(".vp").on("click",".window", onWindowClicked);
}|
function onWindowClicked(e){
    $(this).css("z-index", 100);
}