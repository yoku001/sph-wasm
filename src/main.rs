#[macro_use]
extern crate stdweb;

fn main() {
    stdweb::initialize();

    let message = "はろーわーるど";
    js! {
        alert( @{message} );
        console.log( @{message} );
    }

    stdweb::event_loop();
}