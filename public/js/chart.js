var Chart = function (divId) {
  var divId = "#"+divId;
  var options;
  var customize = function(){
    var rows_template = $("#form-row-template").html();
    $("#model-singleton").find(".modal-title").html("customize chart");
    $("#model-singleton").find(".modal-body").html(rows_template);
    $("#model-singleton").modal('show');

  }
  var chart_line = function (type, data) {
    $(divId).parent().on("click", ".customize",customize);
    $(divId).parent().on("click", ".save",function(){
      alert('save')
    })
    $(divId).parent().on("click", ".share",function(){
      alert('share')
    })
    var _options = data.opts || {
      data: {
        columns: data
      },
      type: type
    };
    _options.bindto=divId;
    chart = c3.generate(_options);
    //chart.transform(type);
  }
  return {
    chart_line: chart_line
  }
}
