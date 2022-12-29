// create a variable to hold the threshold value
let threshold = 25

// update the threshold value when the range input element is changed
document.querySelector('#threshold').addEventListener('input', function(event) {
  threshold = event.target.value;
})

let inputElement = document.getElementById("threshold");
let valueElement = document.getElementById("threshold-value");

// Update the value of the adjacent element when the input value changes
inputElement.addEventListener("input", function() {
  valueElement.innerHTML = inputElement.value;
});

// on submit
document.querySelector('form').addEventListener('submit', function(event) {
    event.preventDefault(); // prevent the form from being submitted

    // select the file input field and get the selected files
    const fileInput = document.querySelector('#images');
    const files = fileInput.files;

    // create a variable to hold the pixels dataset
    pixelsDataset = []

    // create a promise that will resolve when all the images have been processed
    const promise = new Promise((resolve) => {

        // loop through the selected files
        for (let i = 0; i < files.length; i++) {
            // create a new FileReader object
            const reader = new FileReader();
        
            // set the onload event handler
            reader.onload = function() {
                // get the image data as a base64-encoded string
                const dataUrl = reader.result;
        
                // create an image element using JavaScript
                const img = document.createElement('img');
        
                // set the src attribute of the image to the base64-encoded string
                img.src = dataUrl;
        
                // set the onload event handler for the img element
                img.onload = function() {
                    // create a canvas element
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
            
                    // set the width and height of the canvas to the desired size
                    canvas.width = 100;
                    canvas.height = 100;
            
                    // calculate the aspect ratio of the image
                    const aspectRatio = img.naturalWidth / img.naturalHeight;
            
                    let width, height;
            
                    // if the aspect ratio of the image is wider than the canvas
                    if (aspectRatio > 1) {
                        // set the width of the image to the width of the canvas
                        // and calculate the height based on the aspect ratio
                        width = canvas.width;
                        height = canvas.width / aspectRatio;
                    } else {
                        // set the height of the image to the height of the canvas
                        // and calculate the width based on the aspect ratio
                        width = canvas.height * aspectRatio;
                        height = canvas.height;
                    }
            
                    // draw the image on the canvas, preserving the aspect ratio
                    ctx.drawImage(img, 0, 0, width, height);
            
                    // get the image data from the canvas
                    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                    const data = imageData.data;

                    // loop through image data to add to global variable
                    for (let i = 0; i < data.length; i += 4) {
                        pixelsDataset.push([data[i],data[i+1],data[i+2],data[i+3]])
                    }
            
                    // resolve the promise if this is the last image
                    if (i === files.length - 1) {
                        resolve()
                    }
                }
            }
            reader.readAsDataURL(files[i])
        }
    })
    // execute something after the loop has finished processing
    promise.then(() => {
        setTimeout(() => {
            console.log(pixelsDataset)
            centroids = kmeans(pixelsDataset)
            console.log(centroids)
            
            // Empty the "colors" div
            document.getElementById("colors").innerHTML = "";

            // Create a div for each pixel
            for (let pixel of centroids) {
            let [r, g, b, a] = pixel;
            let colorDiv = document.createElement("div");
            let colorCode = "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
            colorDiv.innerHTML = `<div style="display: inline-block; width: 20px; height: 20px; background-color: ${colorCode}"></div> ${colorCode}`;
            document.getElementById("colors").appendChild(colorDiv);
            }
        }, 500);
    })
})

function kmeans(pixels) {
    // set k
    let k = threshold;

    // Initialize centroids randomly
    let centroids = [];
    while (centroids.length < k) {
        let pixel = pixels[Math.floor(Math.random() * pixels.length)];
        if (pixel[0] !== 0 || pixel[1] !== 0 || pixel[2] !== 0 || pixel[3] !== 0) {
            centroids.push(pixel);
        }
    }
    let clusters = []
    while (true) {
      // Create a list to store the pixels in each cluster
      clusters = [];
      for (let i = 0; i < k; i++) {
        clusters.push([]);
      }
  
      // Assign each pixel to the closest centroid
      for (let pixel of pixels) {
        let distances = centroids.map(c => euclideanDistance(pixel, c));
        let clusterIndex = distances.indexOf(Math.min(...distances));
        clusters[clusterIndex].push(pixel);
      }
  
      // Calculate the new centroids as the mean of the pixels in each cluster
      let newCentroids = clusters.map(calculateMean);
  
      // Check if the centroids have changed
      if (newCentroids.every((c, i) => c[0] === centroids[i][0] && c[1] === centroids[i][1] && c[2] === centroids[i][2] && c[3] === centroids[i][3])) {
        break;
      }
      centroids = newCentroids;
      console.log("new step")
    }
  
    // Sort the centroids based on the number of pixels in each cluster
    return centroids.sort((c1, c2) => clusters[centroids.indexOf(c1)].length - clusters[centroids.indexOf(c2)].length);
  }
  
  function euclideanDistance(p1, p2) {
    // Calculate the Euclidean distance between two pixels
    let [r1, g1, b1, a1] = p1;
    let [r2, g2, b2, a2] = p2;
    return Math.sqrt((r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2 + (a1 - a2) ** 2);
  }
  
  function calculateMean(pixels) {
    // Calculate the mean of a list of pixels
    let rSum = 0, gSum = 0, bSum = 0, aSum = 0;
    for (let pixel of pixels) {
      let [r, g, b, a] = pixel;
      rSum += r;
      gSum += g;
      bSum += b;
      aSum += a;
    }
    let numPixels = pixels.length;
    return [Math.floor(rSum / numPixels), Math.floor(gSum / numPixels), Math.floor(bSum / numPixels), Math.floor(aSum / numPixels)];
  }