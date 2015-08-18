<@compress>
<!DOCTYPE html>
<html>
  <head>

    <#include "/common/config.ftl">
    <#include "/common/macro.ftl">

    <title>{{title}}</title>
    <meta charset="utf-8"/>
    <meta name="description" content="{{description}}"/>
    <meta name="keywords" content="{{description}}"/>

    <@css/>
    <link href="${csRoot}{{filename}}.css" rel="stylesheet" type="text/css"/>
  </head>
  <body>

    <!-- Page Content Here -->

    <script src="${nejRoot}"></script>
    <script>
        NEJ.define([
            'pro/{{filename}}'
        ],function(m){
            m._$$Module._$allocate();
        });
    </script>
  </body>
</html>
</@compress>