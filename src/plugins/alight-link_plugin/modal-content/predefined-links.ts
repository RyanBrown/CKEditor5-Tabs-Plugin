import predefinedLinksData from './json/predefined-test-data.json';
import './predefined-links.css';

let filteredLinksData = [...predefinedLinksData]; // A copy of the data to handle filtered results.
let currentSearchQuery = ''; // To retain the search query across renders.

export function getPredefinedLinksContent(page: number = 1, pageSize: number = 10): string {
    const totalItems = filteredLinksData.length;
    const totalPages = Math.ceil(totalItems / pageSize);
    const startIndex = (page - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, totalItems);
    const currentPageData = filteredLinksData.slice(startIndex, endIndex);

    const links = currentPageData.map((link: any) => {
        return `
            <div class="link-item">
                <div>
                    <input type="radio" name="link-selection" value="${link.LinkItemName}" />
                </div>

                <ul>
                    <li>${link.LinkTitleDisplayName}</li>
                    <li><strong>Item Name:</strong> ${link.LinkItemName}</li>
                    <li><strong>Type:</strong> ${link.BaseOrClientSpecific}</li>
                    <li><strong>Page Type:</strong> ${link.PageType}</li>
                    <li><strong>Destination:</strong> ${link.Destination}</li>
                    <li><strong>Domain:</strong> ${link.Domain}</li>
                </ul>
            </div>
        `;
    });

    return `
        <div class="predefined-links">
            <div class="search-container">
                <input 
                    type="text" 
                    class="search-input" 
                    placeholder="Search by title..." 
                    value="${currentSearchQuery}" 
                />
                <button class="reset-search-btn">Reset Search</button>
            </div>
            ${links.length > 0 ? links.join('') : '<p>No results found.</p>'}
            <div class="pagination">
                <button class="page-btn first-page" data-page="1" ${page === 1 ? 'disabled' : ''}>First</button>
                <button class="page-btn prev-page" data-page="${page - 1}" ${
        page === 1 ? 'disabled' : ''
    }>Previous</button>
                <select class="page-select">
                    ${Array.from({ length: totalPages }, (_, i) => {
                        const currentStart = i * pageSize + 1;
                        const currentEnd = Math.min((i + 1) * pageSize, totalItems);
                        return `<option value="${i + 1}" ${i + 1 === page ? 'selected' : ''}>Page ${
                            i + 1
                        } (${currentStart}–${currentEnd} of ${totalItems})</option>`;
                    }).join('')}
                </select>
                <button class="page-btn next-page" data-page="${page + 1}" ${
        page === totalPages ? 'disabled' : ''
    }>Next</button>
                <button class="page-btn last-page" data-page="${totalPages}" ${
        page === totalPages ? 'disabled' : ''
    }>Last</button>
            </div>
        </div>
    `;
}

// Search and render filtered results
function handleSearch(query: string, pageSize: number = 10): void {
    currentSearchQuery = query.toLowerCase(); // Store the search query

    // Check for minimum query length
    if (currentSearchQuery.length < 2) {
        filteredLinksData = [...predefinedLinksData]; // Reset to full data if query is too short
    } else {
        // Filter only `LinkTitleDisplayName` field
        filteredLinksData = predefinedLinksData.filter((link: any) =>
            link.LinkTitleDisplayName.toLowerCase().includes(currentSearchQuery)
        );
    }

    // Reset to the first page of filtered results
    const contentDiv = document.querySelector('.predefined-links-container');
    if (contentDiv) {
        contentDiv.innerHTML = getPredefinedLinksContent(1, pageSize);
        const searchInput = document.querySelector('.search-input') as HTMLInputElement;
        if (searchInput) {
            searchInput.focus(); // Retain focus on the input
            searchInput.selectionStart = searchInput.value.length; // Place cursor at the end
        }
    }
}

// Reset search and render the full data set
function resetSearch(pageSize: number = 10): void {
    filteredLinksData = [...predefinedLinksData]; // Reset to full data
    currentSearchQuery = ''; // Clear the search query
    const contentDiv = document.querySelector('.predefined-links-container');

    if (contentDiv) {
        contentDiv.innerHTML = getPredefinedLinksContent(1, pageSize);
    }
}

// Add event listeners for search, reset, and pagination
document.addEventListener('input', (event) => {
    const target = event.target as HTMLInputElement;
    if (target.classList.contains('search-input')) {
        handleSearch(target.value);
    }
});

document.addEventListener('click', (event) => {
    const target = event.target as HTMLElement;

    // Handle pagination buttons
    if (target.classList.contains('page-btn')) {
        const page = Number(target.dataset.page);
        const pageSize = 10; // Set your desired page size
        const contentDiv = document.querySelector('.predefined-links-container');
        if (contentDiv) {
            contentDiv.innerHTML = getPredefinedLinksContent(page, pageSize);
        }
    }

    // Handle reset search button
    if (target.classList.contains('reset-search-btn')) {
        resetSearch();
    }
});

document.addEventListener('change', (event) => {
    const target = event.target as HTMLSelectElement;
    if (target.classList.contains('page-select')) {
        const page = Number(target.value);
        const pageSize = 10; // Set your desired page size
        const contentDiv = document.querySelector('.predefined-links-container');
        if (contentDiv) {
            contentDiv.innerHTML = getPredefinedLinksContent(page, pageSize);
        }
    }
});
