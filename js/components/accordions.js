/**
 * Accordion Component
 * 
 * Manages expand/collapse functionality for accordion elements like FAQ.
 * Handles accessibility attributes, animations, and state management.
 */

(function() {
    'use strict';

    // Cache DOM elements
    let accordions = [];
    let initialized = false;

    /**
     * Initialize accordions on the page
     */
    function init() {
        if (initialized) return;
        
        // Get all accordion containers on the page
        const accordionContainers = document.querySelectorAll('.faq-accordion, [data-accordion]');
        
        accordionContainers.forEach(container => {
            // Get all questions within this container
            const questions = container.querySelectorAll('.faq-question, [data-accordion-trigger]');
            
            questions.forEach(question => {
                // Add click event listener
                question.addEventListener('click', handleAccordionToggle);
                
                // Add keyboard support for accessibility
                question.addEventListener('keydown', handleKeyDown);
                
                // Store reference for potential destroy method
                accordions.push(question);
            });
        });
        
        // Add event listener for search/filter functionality if present
        const searchInput = document.getElementById('faqSearch');
        if (searchInput) {
            searchInput.addEventListener('input', handleSearch);
        }
        
        initialized = true;
        
        // Log initialization
        if (window.EventBus) {
            window.EventBus.publish('components:accordions:initialized');
        }
    }

    /**
     * Handle accordion toggle when clicked
     * @param {Event} event - Click event
     */
    function handleAccordionToggle(event) {
        const question = event.currentTarget;
        const isExpanded = question.getAttribute('aria-expanded') === 'true';
        const answerId = question.getAttribute('aria-controls');
        const answer = document.getElementById(answerId);
        
        // Toggle the expanded state
        question.setAttribute('aria-expanded', !isExpanded);
        
        // Toggle visibility of the answer
        if (answer) {
            if (isExpanded) {
                // Collapse
                collapseAccordion(answer, question);
            } else {
                // Expand
                expandAccordion(answer, question);
            }
        }
    }
    
    /**
     * Handle keyboard navigation for accessibility
     * @param {KeyboardEvent} event - Keydown event
     */
    function handleKeyDown(event) {
        // Handle Enter or Space key
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            handleAccordionToggle(event);
        }
    }
    
    /**
     * Expand an accordion panel with animation
     * @param {HTMLElement} answer - The answer element to expand
     * @param {HTMLElement} question - The question element
     */
    function expandAccordion(answer, question) {
        // Remove hidden attribute first
        answer.hidden = false;
        
        // Add active class to question if needed
        question.classList.add('active');
        
        // Find the icon element if present and rotate it
        const icon = question.querySelector('.icon-expand');
        if (icon) {
            icon.classList.add('rotate');
        }
        
        // Animate the height from 0 to auto
        answer.style.height = '0';
        answer.style.overflow = 'hidden';
        answer.style.transition = 'height 0.3s ease-out';
        
        // Force browser reflow
        answer.offsetHeight;
        
        // Set actual height based on content
        const height = answer.scrollHeight;
        answer.style.height = height + 'px';
        
        // Clean up after animation completes
        answer.addEventListener('transitionend', function onEnd() {
            answer.style.height = '';
            answer.style.overflow = '';
            answer.style.transition = '';
            answer.removeEventListener('transitionend', onEnd);
            
            // Notify that accordion was expanded (useful for tracking)
            if (window.EventBus) {
                window.EventBus.publish('components:accordion:expanded', {
                    id: answer.id,
                    question: question.textContent.trim()
                });
            }
        }, { once: true });
    }
    
    /**
     * Collapse an accordion panel with animation
     * @param {HTMLElement} answer - The answer element to collapse
     * @param {HTMLElement} question - The question element
     */
    function collapseAccordion(answer, question) {
        // Set initial height to current height
        const height = answer.scrollHeight;
        answer.style.height = height + 'px';
        answer.style.overflow = 'hidden';
        answer.style.transition = 'height 0.3s ease-out';
        
        // Force browser reflow
        answer.offsetHeight;
        
        // Animate to height 0
        answer.style.height = '0';
        
        // Remove active class from question if needed
        question.classList.remove('active');
        
        // Find the icon element if present and reset rotation
        const icon = question.querySelector('.icon-expand');
        if (icon) {
            icon.classList.remove('rotate');
        }
        
        // Hide element after animation completes
        answer.addEventListener('transitionend', function onEnd() {
            answer.hidden = true;
            answer.style.height = '';
            answer.style.overflow = '';
            answer.style.transition = '';
            answer.removeEventListener('transitionend', onEnd);
            
            // Notify that accordion was collapsed
            if (window.EventBus) {
                window.EventBus.publish('components:accordion:collapsed', {
                    id: answer.id
                });
            }
        }, { once: true });
    }
    
    /**
     * Handle search functionality for FAQ
     * @param {Event} event - Input event
     */
    function handleSearch(event) {
        const searchTerm = event.target.value.toLowerCase().trim();
        const accordionItems = document.querySelectorAll('.faq-item');
        
        if (!searchTerm) {
            // If search is empty, show all items
            accordionItems.forEach(item => {
                item.style.display = '';
            });
            return;
        }
        
        let hasResults = false;
        
        // Filter items based on search term
        accordionItems.forEach(item => {
            const question = item.querySelector('.faq-question');
            const answer = item.querySelector('.faq-answer');
            
            const questionText = question.textContent.toLowerCase();
            const answerText = answer.textContent.toLowerCase();
            
            if (questionText.includes(searchTerm) || answerText.includes(searchTerm)) {
                item.style.display = '';
                hasResults = true;
                
                // Automatically expand items that match the search
                if (question.getAttribute('aria-expanded') === 'false') {
                    // Simulate a click to expand the matching item
                    question.click();
                }
            } else {
                item.style.display = 'none';
            }
        });
        
        // Show or hide "no results" message if it exists
        const noResultsMessage = document.querySelector('.faq-no-results');
        if (noResultsMessage) {
            noResultsMessage.hidden = hasResults;
        }
    }
    
    /**
     * Manually open a specific accordion by its ID
     * @param {string} id - The ID of the accordion answer to open
     */
    function openAccordion(id) {
        const answer = document.getElementById(id);
        if (!answer) return;
        
        const question = document.querySelector(`[aria-controls="${id}"]`);
        if (!question) return;
        
        if (question.getAttribute('aria-expanded') === 'false') {
            question.setAttribute('aria-expanded', 'true');
            expandAccordion(answer, question);
        }
    }
    
    /**
     * Manually close a specific accordion by its ID
     * @param {string} id - The ID of the accordion answer to close
     */
    function closeAccordion(id) {
        const answer = document.getElementById(id);
        if (!answer) return;
        
        const question = document.querySelector(`[aria-controls="${id}"]`);
        if (!question) return;
        
        if (question.getAttribute('aria-expanded') === 'true') {
            question.setAttribute('aria-expanded', 'false');
            collapseAccordion(answer, question);
        }
    }
    
    /**
     * Open all accordions in a container
     * @param {string} containerId - The ID of the container (optional)
     */
    function openAll(containerId) {
        const selector = containerId 
            ? `#${containerId} .faq-question[aria-expanded="false"], #${containerId} [data-accordion-trigger][aria-expanded="false"]`
            : '.faq-question[aria-expanded="false"], [data-accordion-trigger][aria-expanded="false"]';
            
        const collapsedQuestions = document.querySelectorAll(selector);
        
        collapsedQuestions.forEach(question => {
            question.click();
        });
    }
    
    /**
     * Close all accordions in a container
     * @param {string} containerId - The ID of the container (optional)
     */
    function closeAll(containerId) {
        const selector = containerId 
            ? `#${containerId} .faq-question[aria-expanded="true"], #${containerId} [data-accordion-trigger][aria-expanded="true"]`
            : '.faq-question[aria-expanded="true"], [data-accordion-trigger][aria-expanded="true"]';
            
        const expandedQuestions = document.querySelectorAll(selector);
        
        expandedQuestions.forEach(question => {
            question.click();
        });
    }
    
    /**
     * Destroy accordion functionality and remove event listeners
     */
    function destroy() {
        accordions.forEach(question => {
            question.removeEventListener('click', handleAccordionToggle);
            question.removeEventListener('keydown', handleKeyDown);
        });
        
        const searchInput = document.getElementById('faqSearch');
        if (searchInput) {
            searchInput.removeEventListener('input', handleSearch);
        }
        
        accordions = [];
        initialized = false;
    }
    
    /**
     * Public API
     */
    window.Accordions = {
        init: init,
        openAccordion: openAccordion,
        closeAccordion: closeAccordion,
        openAll: openAll,
        closeAll: closeAll,
        destroy: destroy
    };
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
