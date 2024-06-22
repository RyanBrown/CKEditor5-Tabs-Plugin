// Generates a unique ID
let counter = 0;
export function generateId(prefix) {
    return `${prefix}_${Date.now()}_${counter++}`;
}
