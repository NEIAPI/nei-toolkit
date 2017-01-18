<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="user-scalable=no, width=device-width">
    <meta name="description" content="<%= description %>"/>
    <meta name="keywords" content="<%= description %>"/>
    <title><%= title %></title>
    <link href="/src/module/common/base.css" rel="stylesheet"/>
    <link href="/src/page/active.css" rel="stylesheet"/>
</head>
<body>
<!-- @DEFINE -->
<script src="/src/lib/nej/src/define.js?pro=../src/"></script>
<script>
    NEJ.define([
        'pro/page/active'
    ], function (m) {
        m._$$Module._$allocate();
    });
</script>
</body>
</html>