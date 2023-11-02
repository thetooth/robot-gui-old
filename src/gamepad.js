const gamepads = {};

function gamepadHandler(event, connected) {
    const gamepad = event.gamepad;
    // Note:
    // gamepad === navigator.getGamepads()[gamepad.index]

    if (connected) {
        gamepads[gamepad.index] = gamepad;
    } else {
        delete gamepads[gamepad.index];
    }
}

window.addEventListener(
    "gamepadconnected",
    (e) => {
        gamepadHandler(e, true);
    },
    false,
);
window.addEventListener(
    "gamepaddisconnected",
    (e) => {
        gamepadHandler(e, false);
    },
    false,
);

export {
    gamepads
}