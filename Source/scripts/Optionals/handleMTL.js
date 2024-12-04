

// Function to modify Ka and Kd properties
export default function modifyMTLProperties(filePath, newKa, newKd) {
    // Read the MTL file content
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Split the content into lines
    const lines = content.split('\n');
    
    // Iterate through each line and modify Ka and Kd properties
    const modifiedLines = lines.map(line => {
        if (line.startsWith('Ka ')) {
            return `Ka ${newKa.join(' ')}`;
        } else if (line.startsWith('Kd ')) {
            return `Kd ${newKd.join(' ')}`;
        }
        return line;
    });
    
    // Join the lines back into a single string
    const modifiedContent = modifiedLines.join('\n');
    
    // Write the modified content back to the MTL file
    fs.writeFileSync(filePath, modifiedContent, 'utf8');
}

// // Example usage
// const mtlFilePath = path.join(__dirname, 'material.mtl');
// const newKa = [0.5, 0.5, 0.5]; // New Ka values
// const newKd = [0.7, 0.7, 0.7]; // New Kd values

// modifyMTLProperties(mtlFilePath, newKa, newKd);