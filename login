<!DOCTYPE html>
<html>

<head>

    <title>Smart Education - Login</title>

    <style>

        body {
            font-family: Arial;
            background: linear-gradient(135deg,#667eea,#764ba2);
            display:flex;
            justify-content:center;
            align-items:center;
            height:100vh;
        }

        .box {
            background:white;
            padding:40px;
            border-radius:15px;
            width:350px;
            box-shadow:0 10px 30px rgba(0,0,0,.3);
        }

        h1 {
            text-align:center;
        }

        input {
            width:100%;
            padding:12px;
            margin:10px 0;
            box-sizing:border-box;
        }

        button {
            width:100%;
            padding:12px;
            background:#667eea;
            color:white;
            border:none;
            border-radius:8px;
            cursor:pointer;
        }

        a {
            text-decoration:none;
        }

        .error {
            color:red;
            text-align:center;
        }

    </style>

</head>

<body>

<div class="box">

    <h1>🎓 Smart Learning</h1>

    <p style="text-align:center;">
        Learn Smart. Learn Better.
    </p>

    {% if error %}
        <p class="error">{{ error }}</p>
    {% endif %}

    <form method="POST">

        <input
            type="email"
            name="email"
            placeholder="Email"
            required
        >

        <input
            type="password"
            name="password"
            placeholder="Password"
            required
        >

        <button type="submit">
            Login
        </button>

    </form>

    <p style="text-align:center;">
        New student?
        <a href="/register">Create Account</a>
    </p>

</div>

</body>
</html>
