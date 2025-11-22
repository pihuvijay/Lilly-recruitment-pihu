document.addEventListener("DOMContentLoaded", () => {
    fetchMedicines();
});
// ### NEW - CODE CHANGE - Objective 2: Enhanced network error handling ###
//function to fetch medicines from backend with comprehensive error handling
function fetchMedicines() {
    // ### NEW - Loading state with animation ###
    const medicineList = document.getElementById("medicineList");
    medicineList.innerHTML = "<p class='loading'>Loading medicines...</p>";
    
    fetch("http://localhost:8000/medicines")
        .then((response) => {
            // ### NEW - HTTP status code validation ###
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            // ### NEW - JSON content type validation ###
            const contentType = response.headers.get("content-type");
            if (!contentType || !contentType.includes("application/json")) {
                throw new Error("Response is not valid JSON");
            }
            
            return response.json();
        })
        .then((data) => {
            // ### NEW - Response structure validation ###
            if (!data || typeof data !== 'object') {
                throw new Error("Invalid response format");
            }
            
            // ### NEW - Missing medicines array handling ###
            if (!data.medicines) {
                console.warn("No medicines array in response");
                displayMedicines([]);
                return;
            }
            
            // ### NEW - Array type validation ###
            if (!Array.isArray(data.medicines)) {
                throw new Error("Medicines data is not an array");
            }
            
            displayMedicines(data.medicines);
        })
        .catch((error) => {
            console.error("Error fetching medicines:", error);
            
            // ### NEW - Specific error message generation ###
            let errorMessage = "Failed to load medicines.";
            let retryButton = "";
            
            // ### NEW - Network connectivity error detection ###
            if (error.message.includes("Failed to fetch")) {
                errorMessage = "Cannot connect to server. Please check if the backend is running.";
                retryButton = "<button onclick='fetchMedicines()' class='retry-btn'>Retry</button>";
            // ### NEW - HTTP error code handling ###
            } else if (error.message.includes("HTTP error")) {
                errorMessage = `Server error (${error.message}). Please try again later.`;
                retryButton = "<button onclick='fetchMedicines()' class='retry-btn'>Retry</button>";
            // ### NEW - JSON parsing error handling ###
            } else if (error.message.includes("JSON")) {
                errorMessage = "Server returned invalid data format.";
            }
            
            medicineList.innerHTML = `
                <div class='error-message'>
                    <p>${errorMessage}</p>
                    ${retryButton}
                </div>
            `;
        });
}
// ### ORIGINAL CODE - Before Objective 2 changes ###
// function displayMedicines(medicines) {
//     const medicineList = document.getElementById("medicineList");
//     medicineList.innerHTML = "";
//     medicines.forEach((medicine) => {
//         const medName = medicine.name || "Unknown Medicine";
//         const medPrice = medicine.price !== null ? `$${medicine.price}` : "Price not available";
//         const medElement = document.createElement("div");
//         medElement.className = "medicine-item";
//         medElement.innerHTML = `<strong>${medName}</strong>: ${medPrice}`;
//         medicineList.appendChild(medElement);
//     });
// }

// ### NEW - CODE CHANGE - Objective 2: Improved Error Handling ###
//function to display medicines with improved error handling
function displayMedicines(medicines) {
    const medicineList = document.getElementById("medicineList");
    medicineList.innerHTML = "";
    
    if (!medicines || medicines.length === 0) {
        medicineList.innerHTML = "<p class='no-data'>No medicines available.</p>";
        return;
    }
    
    // ### NEW - Data quality statistics tracking ###
    let totalMedicines = 0;
    let validMedicines = 0;
    let duplicateNames = new Set();
    let seenNames = new Set();
    
    medicines.forEach((medicine, index) => {
        totalMedicines++;
        
        // ### NEW - Invalid medicine object detection ###
        if (!medicine || typeof medicine !== 'object') {
            console.warn(`Medicine at index ${index} is not a valid object:`, medicine);
            return; // Skip this medicine
        }
        
        // ### NEW - Medicine name validation ###
        const medName = validateMedicineName(medicine.name);
        
        // ### NEW - Duplicate name detection ###
        if (medName.value !== 'Unknown Medicine') {
            const lowerName = medName.value.toLowerCase();
            if (seenNames.has(lowerName)) {
                duplicateNames.add(lowerName);
                medName.hasIssue = true;
                medName.issue = medName.issue ? `${medName.issue}, Duplicate name` : 'Duplicate name';
            } else {
                seenNames.add(lowerName);
            }
        }
        
        // ### NEW - Medicine price validation ###
        const priceInfo = validateMedicinePrice(medicine.price);
        
        // ### NEW - Valid medicine counting ###
        if (!medName.hasIssue && !priceInfo.hasIssue) {
            validMedicines++;
        }
        
        // ### NEW - Medicine element creation with styling ###
        const medElement = document.createElement("div");
        medElement.className = `medicine-item ${priceInfo.cssClass}`;
        
        // ### NEW - Data quality CSS class assignment ###
        const qualityClass = (medName.hasIssue || priceInfo.hasIssue) ? 'data-issues' : 'data-clean';
        medElement.classList.add(qualityClass);
        
        // ### NEW - Medicine HTML with warning/success icons ###
        medElement.innerHTML = `
            <strong class="medicine-name">${medName.value}</strong>: 
            <span class="medicine-price">${priceInfo.display}</span>
            ${medName.hasIssue || priceInfo.hasIssue ? '<span class="data-warning">⚠️</span>' : '<span class="data-clean-icon">✓</span>'}
        `;
        
        // ### NEW - Comprehensive tooltip generation ###
        if (medName.hasIssue || priceInfo.hasIssue) {
            const issues = [];
            if (medName.hasIssue) issues.push(`Name: ${medName.issue}`);
            if (priceInfo.hasIssue) issues.push(`Price: ${priceInfo.issue}`);
            medElement.title = `Data Quality Issues:\n${issues.join('\n')}`;
        } else {
            medElement.title = 'Data quality: Good';
        }
        
        medicineList.appendChild(medElement);
    });
    
    // ### NEW - Data quality percentage calculation ###
    const qualityPercentage = totalMedicines > 0 ? Math.round((validMedicines / totalMedicines) * 100) : 0;
    
    // ### NEW - Data quality summary report generation ###
    const summaryElement = document.createElement("div");
    summaryElement.className = "data-quality-summary";
    summaryElement.innerHTML = `
        <p><strong>Data Quality Report:</strong></p>
        <p>Total medicines: ${totalMedicines} | Valid: ${validMedicines} (${qualityPercentage}%)</p>
        ${duplicateNames.size > 0 ? `<p class="warning">⚠️ Found ${duplicateNames.size} duplicate medicine names</p>` : ''}
    `;
    medicineList.appendChild(summaryElement);
}

// ### NEW - CODE CHANGE - Objective 2: New validation functions ###
// Helper function to validate medicine names
function validateMedicineName(name) {
    if (!name || typeof name !== 'string' || name.trim() === '') {
        return {
            value: 'Unknown Medicine',
            hasIssue: true,
            issue: 'Missing or empty name'
        };
    }
    
    const cleanName = name.trim();
    if (cleanName.length < 2) {
        return {
            value: cleanName || 'Unknown Medicine',
            hasIssue: true,
            issue: 'Name too short'
        };
    }
    
    return {
        value: cleanName,
        hasIssue: false,
        issue: null
    };
}

// Helper function to validate medicine prices
function validateMedicinePrice(price) {
    // Handle null/undefined
    if (price === null || price === undefined) {
        return {
            display: 'Price not available',
            hasIssue: true,
            issue: 'Missing price',
            cssClass: 'price-missing'
        };
    }
    
    // Convert to number if it's a string
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    
    // Check if it's a valid number
    if (isNaN(numPrice)) {
        return {
            display: 'Invalid price',
            hasIssue: true,
            issue: 'Price is not a number',
            cssClass: 'price-invalid'
        };
    }
    
    // Check for negative prices
    if (numPrice < 0) {
        return {
            display: `$${numPrice.toFixed(2)} (Invalid)`,
            hasIssue: true,
            issue: 'Negative price',
            cssClass: 'price-negative'
        };
    }
    
    // Check for unreasonably high prices (over $1000)
    if (numPrice > 1000) {
        return {
            display: `$${numPrice.toFixed(2)}`,
            hasIssue: true,
            issue: 'Unusually high price',
            cssClass: 'price-high'
        };
    }
    
    // Valid price
    return {
        display: `$${numPrice.toFixed(2)}`,
        hasIssue: false,
        issue: null,
        cssClass: 'price-valid'
    };
}
// ### NEW - Objective 3: Enhanced form submission with better validation ###
document.getElementById("addMedicineForm").addEventListener("submit", (event) => {
    event.preventDefault();

    const medName = document.getElementById("medName").value.trim();
    const medPrice = parseFloat(document.getElementById("medPrice").value);

    // ### NEW - Clear previous validation errors ###
    clearValidationErrors();
    
    let hasErrors = false;
    const nameInput = document.getElementById("medName");
    const priceInput = document.getElementById("medPrice");

    // ### NEW - Enhanced name validation with visual feedback ###
    if (!medName) {
        showFieldError(nameInput, "Medicine name is required");
        hasErrors = true;
    } else if (medName.length < 2) {
        showFieldError(nameInput, "Medicine name must be at least 2 characters");
        hasErrors = true;
    }

    // ### NEW - Enhanced price validation with specific error messages ###
    if (isNaN(medPrice)) {
        showFieldError(priceInput, "Please enter a valid number");
        hasErrors = true;
    } else if (medPrice <= 0) {
        showFieldError(priceInput, "Price must be greater than $0");
        hasErrors = true;
    } else if (medPrice > 10000) {
        showFieldError(priceInput, "Price seems unreasonably high (over $10,000)");
        hasErrors = true;
    }

    if (hasErrors) {
        return;
    }

    // ### NEW - Show loading state during form submission ###
    showFormLoading(true);
    
    // ### NEW - Check if form is in edit mode or create mode ###
    const form = document.getElementById('addMedicineForm');
    if (form.dataset.editMode === 'true') {
        updateMedicine(form.dataset.originalName, medName, medPrice);
    } else {
        createMedicine(medName, medPrice);
    }
});
//function to create and add new medicine
function createMedicine(name, price) {
    fetch("http://localhost:8000/create", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ name, price })
    })
        .then((response) => response.json())
        .then((data) => {
            if (data.error) {
                alert(data.error);
            } else {
                alert(data.message);
                fetchMedicines();
                document.getElementById("addMedicineForm").reset();
            }
        })
        .catch((error) => {
            console.error("Error creating medicine:", error);
            alert("Failed to add medicine.");
        });
}

// Function to fetch and display the average price
function fetchAveragePrice() {
    fetch("http://localhost:8000/average-price")
        .then((response) => {
            if (!response.ok) {
                throw new Error("Failed to fetch average price.");
            }
            return response.json();
        })
        .then((data) => {
            const displayElement = document.getElementById("averagePriceDisplay");
            if (data.error) {
                displayElement.textContent = `Error: ${data.error}`;
            } else {
                displayElement.textContent = `Price Average: $${data.average_price}`;
            }
        })
        .catch((error) => {
            console.error("Error fetching average price:", error);
            document.getElementById("averagePriceDisplay").textContent =
                "Failed to calculate average price. Please try again.";
        });
}
document
    .getElementById("averagePriceButton")
    .addEventListener("click", fetchAveragePrice);

// ### NEW - Missing validation functions ###
function clearValidationErrors() {
    document.querySelectorAll('.error').forEach(input => {
        input.classList.remove('error');
    });
    document.querySelectorAll('.field-error').forEach(error => {
        error.remove();
    });
}

function showFieldError(inputElement, message) {
    inputElement.classList.add('error');
    
    const existingError = inputElement.parentNode.querySelector('.field-error');
    if (existingError) {
        existingError.remove();
    }
    
    const errorElement = document.createElement('div');
    errorElement.className = 'field-error';
    errorElement.textContent = message;
    inputElement.parentNode.appendChild(errorElement);
}

function showFormLoading(isLoading) {
    const submitButton = document.querySelector('#addMedicineForm button[type="submit"]');
    const form = document.getElementById('addMedicineForm');
    
    if (isLoading) {
        submitButton.disabled = true;
        submitButton.textContent = 'Adding Medicine...';
        form.classList.add('loading');
    } else {
        submitButton.disabled = false;
        submitButton.textContent = 'Add Medicine';
        form.classList.remove('loading');
    }
}

function showNotification(message, type = 'info') {
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notification => notification.remove());
    
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <span class="notification-message">${message}</span>
        <button class="notification-close" onclick="this.parentElement.remove()">×</button>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
    
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
}
