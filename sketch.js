let mode = 'pencil'; // Ξεκινάμε με mode μολύβι

function setup() {
    let canvas = createCanvas(800, 800);
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

let refImage;

function preload() {
    // Εδώ κάνεις επικόλληση το Public URL από το Supabase
    refImage = loadImage('https://your-id.supabase.co/storage/v1/object/public/tutorials/run_pose.png');
}

// Αντικατάστησε τα "..." με τα δικά σου στοιχεία από το Supabase Settings -> API
const SUPABASE_URL = 'https://cfiecgwbfcebzvvyqfaw.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNmaWVjZ3diZmNlYnp2dnlxZmF3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM2NjgyNzMsImV4cCI6MjA4OTI0NDI3M30.UUlLuQZ8y55LeaS4awvzmkvEis5Uc1HuMmtSWydF06U';

const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);