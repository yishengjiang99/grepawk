
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">

    <!-- CSRF Token -->
    <meta name="csrf-token" content="TU2C6PEkC99KSgjEasqcOYns2932RENDAYCygtMj">

    <title>grepawk</title>

    <!-- Scripts -->
    <script src="https://code.jquery.com/jquery-2.1.1.min.js"></script>
    


    <!-- Fonts -->
    <link rel="dns-prefetch" href="//fonts.gstatic.com">
    <link href="https://fonts.googleapis.com/css?family=Nunito" rel="stylesheet" type="text/css">

    <!-- Styles -->
    <link href="/css/app.css" rel="stylesheet">
</head>

<body>
    <div id="app">
        <nav class="navbar navbar-expand-md navbar-light navbar-laravel">
            <div class="container">
                <a class="navbar-brand" href="/index.php">
                    grepawk
                </a>
                <button class="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
                    <span class="navbar-toggler-icon"></span>
                </button>

                <div class="collapse navbar-collapse" id="navbarSupportedContent">
                    <!-- Left Side Of Navbar -->
                    <ul class="navbar-nav mr-auto">

                    </ul>

                    <!-- Right Side Of Navbar -->
                    <ul class="navbar-nav ml-auto">
                        <!-- Authentication Links -->
                                                    <li class="nav-item dropdown">
                                <a id="navbarDropdown" class="nav-link dropdown-toggle" href="#" role="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false" v-pre>
                                    Guest <span class="caret"></span>
                                </a>

                                <div class="dropdown-menu dropdown-menu-right" aria-labelledby="navbarDropdown">
                                    <a class="dropdown-item" href="http://localhost:8002/logout"
                                       onclick="event.preventDefault();
                                                     document.getElementById('logout-form').submit();">
                                        Logout
                                    </a>

                                    <form id="logout-form" action="http://localhost:8002/logout" method="POST" style="display: none;">
                                        <input type="hidden" name="_token" value="TU2C6PEkC99KSgjEasqcOYns2932RENDAYCygtMj">                                    </form>
                                </div>
                            </li>
                                            </ul>
                </div>
            </div>
        </nav>

        <main class="py-4">
            <div class='container'>
<div style='margin: auto; width: 80%'>
    <iframe src="http://localhost:8002/terminal" height=640 width='100%'></iframe>
</div>
</div>

        </main>
    </div>
</body>
</html>

