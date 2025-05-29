use actix_files::Files;
use actix_web::{ get, web, App, HttpResponse, HttpServer, Responder };
use std::{ env, io::{ Error, ErrorKind }, path::Path, process::Command };

#[get("/get/{url:.*}")]
async fn hello(url: web::Path<String>) -> impl Responder {
    let command = Command::new("single-file")
        .arg("--browser-executable-path")
        .arg("chromium")
        .arg(url.to_string())
        .arg("--dump-content")
        .output();

    let output = match command {
        Ok(out) => out,
        Err(e) => {
            eprintln!("Command execution failed: {}", e);
            return HttpResponse::InternalServerError().body("Error running single-file.");
        }
    };

    match String::from_utf8(output.stdout) {
        Ok(stdout) => {
            if stdout.is_empty() {
                HttpResponse::NotFound().body(url.to_string())
            } else {
                HttpResponse::Ok().body(stdout)
            }
        }
        Err(e) => {
            eprintln!("Output decoding failed: {}", e);
            HttpResponse::InternalServerError().body("Invalid output encoding.")
        }
    }
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    let path = Path::new("./dist");
    if !path.exists() {
        return Err(
            Error::new(ErrorKind::NotFound, format!("Path '{}' does not exist", path.display()))
        );
    }

    let host = env::var("HOST").unwrap_or("0.0.0.0".to_string());

    let port: u16 = env
        ::var("PORT")
        .unwrap_or("8080".to_string())
        .parse()
        .unwrap_or_else(|_| {
            eprintln!("PORT environment variable is not a valid u16");
            std::process::exit(1);
        });

    println!("Listening on {}:{}", host, port);

    HttpServer::new(move || {
        App::new().service(hello).service(Files::new("/", "./dist").index_file("index.html"))
    })
        .bind((host, port))?
        .run().await
}
