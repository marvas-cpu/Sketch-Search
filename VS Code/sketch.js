let mode = 'pencil'; // Ξεκινάμε με mode μολύβι

function setup() {
    let canvas = createCanvas(500, 500);
    canvas.parent('canvas-container');
    background(255);
}

function draw() {
    if (mouseIsPressed) {
        if (mode === 'pencil') {
            stroke(0);        // Μαύρο για το μολύβι
            strokeWeight(4);  // Λεπτή γραμμή
        } else {
            stroke(255);      // Λευκό για τη γόμα (σβήνει το μαύρο)
            strokeWeight(30); // Χοντρή γραμμή για να σβήνει εύκολα
        }
        line(mouseX, mouseY, pmouseX, pmouseY);
    }
}

// Αυτές οι συναρτήσεις θα καλούνται από τα κουμπιά στο HTML
function usePencil() {
    mode = 'pencil';
}

function useEraser() {
    mode = 'eraser';
}

function clearCanvas() {
    background(255);
}