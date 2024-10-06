const fs = require('fs');
const path = require('path'); // Importing the path module for file handling
const readline = require('readline'); // Importing readline for user input

class SparseMatrix {
    constructor(numRows, numCols) {
        this.numRows = numRows; // Number of rows in the matrix
        this.numCols = numCols; // Number of columns in the matrix
        this.data = {}; // Object to store non-zero values
    }

    static fromFile(filePath) {
        const fileContent = fs.readFileSync(filePath, 'utf8').split('\n');
        
        // Extract dimensions from the first two lines
        const rows = parseInt(fileContent[0].split('=')[1]);
        const cols = parseInt(fileContent[1].split('=')[1]);
        
        const matrix = new SparseMatrix(rows, cols);

        // Process each line to populate the matrix data
        for (let i = 2; i < fileContent.length; i++) {
            const line = fileContent[i].trim();
            if (line) {
                const match = line.match(/\((\d+),\s*(\d+),\s*(-?\d+)\)/);
                if (match) {
                    const row = parseInt(match[1]);
                    const col = parseInt(match[2]);
                    const value = parseInt(match[3]);
                    matrix.setElement(row, col, value);
                } else {
                    throw new Error("Input file has wrong format");
                }
            }
        }

        return matrix; // Return the populated SparseMatrix instance
    }

    getElement(row, col) {
        return this.data[`${row},${col}`] || 0; // Return value or 0 if not found
    }

    setElement(row, col, value) {
        if (value !== 0) {
            this.data[`${row},${col}`] = value; // Store non-zero values
        } else {
            delete this.data[`${row},${col}`]; // Remove entry for zero values
        }
    }

    add(matrixB) {
        if (this.numRows !== matrixB.numRows || this.numCols !== matrixB.numCols) {
            throw new Error("Matrices dimensions do not match for addition.");
        }
        
        const result = new SparseMatrix(this.numRows, this.numCols);
        
        for (const key in this.data) {
            result.setElement(...key.split(',').map(Number), this.getElement(...key.split(',').map(Number)) + matrixB.getElement(...key.split(',').map(Number)));
        }

        for (const key in matrixB.data) {
            if (!result.data[key]) {
                result.setElement(...key.split(',').map(Number), matrixB.getElement(...key.split(',').map(Number)));
            }
        }

        return result;
    }

    subtract(matrixB) {
        if (this.numRows !== matrixB.numRows || this.numCols !== matrixB.numCols) {
            throw new Error("Matrices dimensions do not match for subtraction.");
        }
        
        const result = new SparseMatrix(this.numRows, this.numCols);
        
        for (const key in this.data) {
            result.setElement(...key.split(',').map(Number), this.getElement(...key.split(',').map(Number)) - matrixB.getElement(...key.split(',').map(Number)));
        }

        for (const key in matrixB.data) {
            if (!result.data[key]) {
                result.setElement(...key.split(',').map(Number), -matrixB.getElement(...key.split(',').map(Number)));
            }
        }

        return result;
    }

    multiply(matrixB) {
        if (this.numCols !== matrixB.numRows) {
            throw new Error("Matrices dimensions do not match for multiplication.");
        }
        
        const result = new SparseMatrix(this.numRows, matrixB.numCols);

        for (const keyA in this.data) {
            const [rowA, colA] = keyA.split(',').map(Number);
            for (const keyB in matrixB.data) {
                const [rowB, colB] = keyB.split(',').map(Number);
                if (colA === rowB) { // Check for valid multiplication condition
                    result.setElement(rowA, colB, result.getElement(rowA, colB) + this.getElement(rowA, colA) * matrixB.getElement(rowB, colB));
                }
            }
        }

        return result;
    }

    toString() {
        let output = `rows=${this.numRows}\ncols=${this.numCols}\n`;
        
        for (const key in this.data) {
            output += `(${key}, ${this.data[key]})\n`;
        }
        
        return output.trim(); // Return formatted string representation of the sparse matrix
    }
}

// Function to get user input
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

// Request paths to two different files
rl.question('Enter the path to the first sparse matrix file: ', (filePath1) => {
    rl.question('Enter the path to the second sparse matrix file: ', (filePath2) => {

        try {
            const matrixA = SparseMatrix.fromFile(filePath1);
            const matrixB = SparseMatrix.fromFile(filePath2);

            // Ask user which operation to perform
            rl.question('Which operation would you like to perform? (add/subtract/multiply): ', (operation) => {

                let result;
                switch (operation.toLowerCase()) {
                    case 'add':
                        result = matrixA.add(matrixB);
                        break;
                    case 'subtract':
                        result = matrixA.subtract(matrixB);
                        break;
                    case 'multiply':
                        result = matrixA.multiply(matrixB);
                        break;
                    default:
                        console.error("Invalid operation. Please enter add, subtract, or multiply.");
                        rl.close(); // Close readline on invalid operation
                        return;
                }

                // Request output file name from user and construct path
                rl.question('Enter the output filename (without extension): ', (outputFileName) => {

                    const outputFilePath = path.join(__dirname, '../../sample_outputs/', `${outputFileName}.txt`);

                    // Write results to output file
                    fs.writeFileSync(outputFilePath, `Result of ${operation}:\n${result.toString()}\n`);

                    console.log(`Results have been written to ${outputFilePath}`);
                    rl.close(); // Close the readline interface
                });
                
            });

        } catch (error) {
            console.error("Error:", error.message); // Log any errors encountered
            rl.close(); // Close readline on error as well
        }
    });
});