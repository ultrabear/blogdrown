use core::fmt;

use axum::http::{Method, StatusCode};
use axum::{extract::Request, middleware::Next, response::Response};

#[derive(Copy, Clone)]
enum Color {
    Black = 0,
    Red,
    Green,
    Yellow,
    Blue,
    Magenta,
    Cyan,
    White,
}

#[derive(Copy, Clone)]
enum Brightness {
    Dim = 30,
    Bright = 90,
}

struct Ansi(Brightness, Color);

impl fmt::Display for Ansi {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "\x1b[{}m", self.0 as u8 + self.1 as u8)
    }
}

struct ColoredStatusCode(StatusCode);

impl fmt::Display for ColoredStatusCode {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        use Brightness::*;
        use Color::*;
        if self.0.is_success() {
            write!(f, "{}", Ansi(Bright, Green))?;
        } else if self.0.is_redirection() {
            write!(f, "{}", Ansi(Dim, Yellow))?;
        } else if self.0.is_client_error() {
            write!(f, "{}", Ansi(Bright, Yellow))?;
        } else if self.0.is_server_error() {
            write!(f, "{}", Ansi(Bright, Red))?;
        } else if self.0.is_informational() {
            write!(f, "{}", Ansi(Bright, Blue))?;
        }

        write!(f, "{}\x1b[0m", self.0)
    }
}

struct ColoredMethod(Method);

impl fmt::Display for ColoredMethod {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        use Brightness::*;
        use Color::*;

        let color = match self.0 {
            Method::GET => Ansi(Bright, Green),
            Method::POST => Ansi(Bright, Yellow),
            Method::PUT => Ansi(Bright, Blue),
            Method::PATCH => Ansi(Dim, Magenta),
            Method::DELETE => Ansi(Bright, Red),
            Method::HEAD => Ansi(Bright, Green),
            Method::OPTIONS => Ansi(Bright, Magenta),
            _ => Ansi(Bright, White),
        };

        write!(f, "{color}{}\x1b[0m", self.0)
    }
}

pub async fn response_logger(req: Request, next: Next) -> Response {
    let uri = req.uri().clone();
    let meth = req.method().clone();
    let httpver = req.version();

    let res = next.run(req).await;

    tracing::info!(
        "\x1b[37m{:?} {} '{}' - {}",
        httpver,
        ColoredMethod(meth),
        uri,
        ColoredStatusCode(res.status())
    );

    res
}
