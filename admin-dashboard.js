// Admin Dashboard JavaScript for Lashed By Anna
import { db } from './firebase-config.js';
import { 
    collection, 
    doc, 
    getDocs, 
    getDoc, 
    updateDoc, 
    deleteDoc, 
    addDoc, 
    query, 
    where, 
    orderBy, 
    onSnapshot,
    Timestamp 
} from 'firebase/firestore';
import { syncUserWithFirebase } from './auth/clerk-config.js';
import { emailService } from './firebase/email-service.js';

// Initialize Clerk
const clerk = window.Clerk;

class AdminDashboard {
    constructor() {
        this.currentSection = 'dashboard';
        this.appointments = [];
        this.clients = [];
        this.services = [];
        this.businessSettings = {};
        this.currentDate = new Date();
        this.unsubscribers = [];
        
        this.init();
    }

    async init() {
        try {
            // Wait for Clerk to load
            await clerk.load();
            
            // Check authentication
            if (!clerk.user) {
                window.location.href = '/admin/sign-in';
                return;
            }

            // Sync user with Firebase
            await syncUserWithFirebase(clerk.user);
            
            // Setup user profile in navbar
            this.setupUserProfile();
            
            // Initialize event listeners
            this.initializeEventListeners();
            
            // Load initial data
            await this.loadInitialData();
            
            // Setup real-time listeners
            this.setupRealtimeListeners();
            
            // Initialize current section
            this.showSection(this.currentSection);
            
            console.log('✅ Admin Dashboard initialized successfully');
            
        } catch (error) {
            console.error('❌ Error initializing admin dashboard:', error);
            this.showError('Failed to initialize dashboard. Please refresh the page.');
        }
    }

    setupUserProfile() {
        const userProfileElement = document.getElementById('admin-user-profile');
        if (userProfileElement) {
            clerk.mountUserButton(userProfileElement, {
                afterSignOutUrl: '/',
                appearance: {
                    theme: {
                        variables: {
                            colorPrimary: '#8B7355',
                            fontFamily: 'Inter, system-ui, -apple-system, sans-serif'
                        }
                    }
                }
            });
        }
    }

    initializeEventListeners() {
        // Navigation
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = link.getAttribute('href').substring(1);
                this.showSection(section);
            });
        });

        // Dashboard quick actions
        const actionCards = document.querySelectorAll('.action-card');
        actionCards.forEach(card => {
            card.addEventListener('click', () => {
                const action = card.getAttribute('data-action');
                this.handleQuickAction(action);
            });
        });

        // Add appointment button
        const addAppointmentBtn = document.getElementById('add-appointment-btn');
        if (addAppointmentBtn) {
            addAppointmentBtn.addEventListener('click', () => this.showAddAppointmentModal());
        }

        // Modal close
        const modalClose = document.getElementById('modal-close');
        if (modalClose) {
            modalClose.addEventListener('click', () => this.hideModal());
        }

        // Appointment filters
        const statusFilter = document.getElementById('appointment-status-filter');
        const dateFilter = document.getElementById('appointment-date-filter');
        
        if (statusFilter) {
            statusFilter.addEventListener('change', () => this.filterAppointments());
        }
        
        if (dateFilter) {
            dateFilter.addEventListener('change', () => this.filterAppointments());
        }

        // Client search
        const clientSearch = document.getElementById('client-search');
        if (clientSearch) {
            clientSearch.addEventListener('input', (e) => this.searchClients(e.target.value));
        }

        // Calendar navigation
        const calendarPrev = document.getElementById('calendar-prev');
        const calendarNext = document.getElementById('calendar-next');
        const calendarToday = document.getElementById('calendar-today');

        if (calendarPrev) {
            calendarPrev.addEventListener('click', () => this.navigateCalendar(-1));
        }
        
        if (calendarNext) {
            calendarNext.addEventListener('click', () => this.navigateCalendar(1));
        }
        
        if (calendarToday) {
            calendarToday.addEventListener('click', () => this.goToToday());
        }

        // Settings forms
        const businessForm = document.getElementById('business-settings-form');
        const bookingForm = document.getElementById('booking-settings-form');
        const workingHoursForm = document.getElementById('working-hours-form');
        const notificationForm = document.getElementById('notification-settings-form');

        if (businessForm) {
            businessForm.addEventListener('submit', (e) => this.saveBusinessSettings(e));
        }
        
        if (bookingForm) {
            bookingForm.addEventListener('submit', (e) => this.saveBookingSettings(e));
        }
        
        if (workingHoursForm) {
            workingHoursForm.addEventListener('submit', (e) => this.saveWorkingHours(e));
        }
        
        if (notificationForm) {
            notificationForm.addEventListener('submit', (e) => this.saveNotificationSettings(e));
        }
    }

    async loadInitialData() {
        this.showLoading(true);
        
        try {
            await Promise.all([
                this.loadServices(),
                this.loadBusinessSettings(),
                this.loadAppointments(),
                this.loadClients()
            ]);
            
            this.updateDashboardStats();
            
        } catch (error) {
            console.error('Error loading initial data:', error);
            this.showError('Failed to load dashboard data.');
        } finally {
            this.showLoading(false);
        }
    }

    async loadServices() {
        try {
            const servicesSnapshot = await getDocs(collection(db, 'services'));
            this.services = servicesSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Error loading services:', error);
        }
    }

    async loadBusinessSettings() {
        try {
            const settingsDoc = await getDoc(doc(db, 'businessSettings', 'main'));
            if (settingsDoc.exists()) {
                this.businessSettings = settingsDoc.data();
                this.populateSettingsForm();
            }
        } catch (error) {
            console.error('Error loading business settings:', error);
        }
    }

    async loadAppointments() {
        try {
            const appointmentsQuery = query(
                collection(db, 'appointments'),
                orderBy('appointmentDateTime', 'desc')
            );
            
            const appointmentsSnapshot = await getDocs(appointmentsQuery);
            this.appointments = appointmentsSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                appointmentDateTime: doc.data().appointmentDateTime?.toDate()
            }));
            
            this.renderAppointmentsTable();
            this.renderPendingApprovals();
            
        } catch (error) {
            console.error('Error loading appointments:', error);
        }
    }

    async loadClients() {
        try {
            const clientsSnapshot = await getDocs(collection(db, 'users'));
            this.clients = clientsSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })).filter(user => user.role === 'client');
            
            this.renderClientsGrid();
            
        } catch (error) {
            console.error('Error loading clients:', error);
        }
    }

    setupRealtimeListeners() {
        // Listen for appointment changes
        const appointmentsQuery = query(
            collection(db, 'appointments'),
            orderBy('appointmentDateTime', 'desc')
        );
        
        const unsubscribeAppointments = onSnapshot(appointmentsQuery, (snapshot) => {
            this.appointments = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                appointmentDateTime: doc.data().appointmentDateTime?.toDate()
            }));
            
            this.renderAppointmentsTable();
            this.renderPendingApprovals();
            this.updateDashboardStats();
        });

        this.unsubscribers.push(unsubscribeAppointments);
    }

    showSection(sectionId) {
        // Update navigation
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${sectionId}`) {
                link.classList.add('active');
            }
        });

        // Update sections
        const sections = document.querySelectorAll('.admin-section');
        sections.forEach(section => {
            section.classList.remove('active');
        });

        const targetSection = document.getElementById(sectionId);
        if (targetSection) {
            targetSection.classList.add('active');
            this.currentSection = sectionId;
        }

        // Load section-specific data
        this.loadSectionData(sectionId);
    }

    async loadSectionData(sectionId) {
        switch (sectionId) {
            case 'dashboard':
                this.updateDashboardStats();
                this.renderRecentActivity();
                break;
            case 'appointments':
                this.renderAppointmentsTable();
                this.renderPendingApprovals();
                break;
            case 'clients':
                this.renderClientsGrid();
                break;
            case 'calendar':
                this.renderCalendar();
                break;
            case 'settings':
                this.populateSettingsForm();
                break;
        }
    }

    updateDashboardStats() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const todayAppointments = this.appointments.filter(apt => {
            const aptDate = new Date(apt.appointmentDateTime);
            return aptDate >= today && aptDate < tomorrow && apt.status === 'confirmed';
        });

        const pendingApprovals = this.appointments.filter(apt => apt.status === 'pending');

        const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
        
        const monthlyRevenue = this.appointments
            .filter(apt => {
                const aptDate = new Date(apt.appointmentDateTime);
                return aptDate >= thisMonth && aptDate < nextMonth && apt.status === 'completed';
            })
            .reduce((total, apt) => total + (apt.totalPrice || 0), 0);

        // Update DOM elements
        this.updateStatElement('today-appointments', todayAppointments.length);
        this.updateStatElement('pending-approvals', pendingApprovals.length);
        this.updateStatElement('monthly-revenue', `$${monthlyRevenue.toFixed(2)}`);
        this.updateStatElement('total-clients', this.clients.length);

        // Update quick action counts
        this.updateStatElement('pending-count', `${pendingApprovals.length} pending`);
        this.updateStatElement('today-count', `${todayAppointments.length} appointments`);
        this.updateStatElement('client-count', `${this.clients.length} clients`);
    }

    updateStatElement(elementId, value) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = value;
        }
    }

    renderPendingApprovals() {
        const pendingAppointments = this.appointments.filter(apt => apt.status === 'pending');
        const container = document.getElementById('pending-appointments-grid');
        const badge = document.getElementById('pending-badge');
        
        if (!container) return;

        // Update badge
        if (badge) {
            badge.textContent = pendingAppointments.length;
        }

        if (pendingAppointments.length === 0) {
            container.innerHTML = '<p class="no-pending">No pending approvals</p>';
            return;
        }

        container.innerHTML = pendingAppointments.map(appointment => `
            <div class="appointment-card pending">
                <div class="appointment-header">
                    <h4>${appointment.clientName}</h4>
                    <span class="appointment-time">${this.formatDateTime(appointment.appointmentDateTime)}</span>
                </div>
                <div class="appointment-details">
                    <p><strong>Service:</strong> ${appointment.serviceName}</p>
                    <p><strong>Duration:</strong> ${appointment.duration} minutes</p>
                    <p><strong>Price:</strong> $${appointment.totalPrice}</p>
                    <p><strong>Phone:</strong> ${appointment.clientPhone}</p>
                    <p><strong>Email:</strong> ${appointment.clientEmail}</p>
                </div>
                <div class="appointment-actions">
                    <button class="btn-success" onclick="adminDashboard.approveAppointment('${appointment.id}')">
                        Approve
                    </button>
                    <button class="btn-danger" onclick="adminDashboard.rejectAppointment('${appointment.id}')">
                        Reject
                    </button>
                </div>
            </div>
        `).join('');
    }

    async approveAppointment(appointmentId) {
        try {
            // Get appointment data first
            const appointmentDoc = await getDoc(doc(db, 'appointments', appointmentId));
            if (!appointmentDoc.exists()) {
                throw new Error('Appointment not found');
            }
            
            const appointmentData = {
                id: appointmentDoc.id,
                ...appointmentDoc.data(),
                appointmentDateTime: appointmentDoc.data().appointmentDateTime.toDate()
            };
            
            // Update appointment status
            await updateDoc(doc(db, 'appointments', appointmentId), {
                status: 'confirmed',
                confirmedAt: Timestamp.now(),
                updatedAt: Timestamp.now()
            });

            this.showSuccess('Appointment approved successfully!');
            
            // Send confirmation email
            await emailService.sendBookingNotification(appointmentData, 'confirmation');
            
        } catch (error) {
            console.error('Error approving appointment:', error);
            this.showError('Failed to approve appointment.');
        }
    }

    async rejectAppointment(appointmentId) {
        try {
            // Get appointment data first
            const appointmentDoc = await getDoc(doc(db, 'appointments', appointmentId));
            if (!appointmentDoc.exists()) {
                throw new Error('Appointment not found');
            }
            
            const appointmentData = {
                id: appointmentDoc.id,
                ...appointmentDoc.data(),
                appointmentDateTime: appointmentDoc.data().appointmentDateTime.toDate()
            };
            
            // Update appointment status
            await updateDoc(doc(db, 'appointments', appointmentId), {
                status: 'cancelled',
                cancelledAt: Timestamp.now(),
                updatedAt: Timestamp.now(),
                cancellationReason: 'Rejected by esthetician'
            });

            this.showSuccess('Appointment rejected successfully!');
            
            // Send rejection notification (you could create a custom rejection template)
            console.log(`📧 Appointment ${appointmentId} was rejected - notification would be sent to ${appointmentData.clientEmail}`);
            
        } catch (error) {
            console.error('Error rejecting appointment:', error);
            this.showError('Failed to reject appointment.');
        }
    }

    renderAppointmentsTable() {
        const tableBody = document.getElementById('appointments-table-body');
        if (!tableBody) return;

        const filteredAppointments = this.getFilteredAppointments();

        if (filteredAppointments.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align: center; padding: 2rem; color: #6b6b6b;">
                        No appointments found
                    </td>
                </tr>
            `;
            return;
        }

        tableBody.innerHTML = filteredAppointments.map(appointment => `
            <tr>
                <td>
                    <div class="client-info">
                        <strong>${appointment.clientName}</strong>
                        <div class="client-contact">
                            <small>${appointment.clientEmail}</small><br>
                            <small>${appointment.clientPhone}</small>
                        </div>
                    </div>
                </td>
                <td>${appointment.serviceName}</td>
                <td>${this.formatDateTime(appointment.appointmentDateTime)}</td>
                <td>${appointment.duration} min</td>
                <td>$${appointment.totalPrice}</td>
                <td>
                    <span class="status-badge status-${appointment.status}">
                        ${appointment.status}
                    </span>
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-sm" onclick="adminDashboard.viewAppointment('${appointment.id}')">
                            View
                        </button>
                        ${appointment.status === 'pending' ? `
                            <button class="btn-sm btn-success" onclick="adminDashboard.approveAppointment('${appointment.id}')">
                                Approve
                            </button>
                        ` : ''}
                        ${appointment.status !== 'completed' ? `
                            <button class="btn-sm btn-danger" onclick="adminDashboard.cancelAppointment('${appointment.id}')">
                                Cancel
                            </button>
                        ` : ''}
                    </div>
                </td>
            </tr>
        `).join('');
    }

    getFilteredAppointments() {
        let filtered = [...this.appointments];

        // Status filter
        const statusFilter = document.getElementById('appointment-status-filter');
        if (statusFilter && statusFilter.value !== 'all') {
            filtered = filtered.filter(apt => apt.status === statusFilter.value);
        }

        // Date filter
        const dateFilter = document.getElementById('appointment-date-filter');
        if (dateFilter && dateFilter.value) {
            const filterDate = new Date(dateFilter.value);
            filtered = filtered.filter(apt => {
                const aptDate = new Date(apt.appointmentDateTime);
                return aptDate.toDateString() === filterDate.toDateString();
            });
        }

        return filtered;
    }

    renderClientsGrid() {
        const container = document.getElementById('clients-grid');
        if (!container) return;

        if (this.clients.length === 0) {
            container.innerHTML = '<p class="no-clients">No clients found</p>';
            return;
        }

        container.innerHTML = this.clients.map(client => `
            <div class="client-card">
                <div class="client-avatar">
                    ${client.profileImageUrl ? 
                        `<img src="${client.profileImageUrl}" alt="${client.firstName} ${client.lastName}">` :
                        `<div class="avatar-placeholder">${(client.firstName?.[0] || '') + (client.lastName?.[0] || '')}</div>`
                    }
                </div>
                <div class="client-info">
                    <h4>${client.firstName} ${client.lastName}</h4>
                    <p>${client.email}</p>
                    <p>${client.phone || 'No phone'}</p>
                    <div class="client-stats">
                        <span>Total Appointments: ${this.getClientAppointmentCount(client.id)}</span>
                    </div>
                </div>
                <div class="client-actions">
                    <button class="btn-secondary" onclick="adminDashboard.viewClientHistory('${client.id}')">
                        View History
                    </button>
                </div>
            </div>
        `).join('');
    }

    getClientAppointmentCount(clientId) {
        return this.appointments.filter(apt => apt.clientId === clientId).length;
    }

    searchClients(searchTerm) {
        if (!searchTerm) {
            this.renderClientsGrid();
            return;
        }

        const filtered = this.clients.filter(client => 
            `${client.firstName} ${client.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
            client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (client.phone && client.phone.includes(searchTerm))
        );

        const container = document.getElementById('clients-grid');
        if (!container) return;

        container.innerHTML = filtered.map(client => `
            <div class="client-card">
                <div class="client-avatar">
                    ${client.profileImageUrl ? 
                        `<img src="${client.profileImageUrl}" alt="${client.firstName} ${client.lastName}">` :
                        `<div class="avatar-placeholder">${(client.firstName?.[0] || '') + (client.lastName?.[0] || '')}</div>`
                    }
                </div>
                <div class="client-info">
                    <h4>${client.firstName} ${client.lastName}</h4>
                    <p>${client.email}</p>
                    <p>${client.phone || 'No phone'}</p>
                    <div class="client-stats">
                        <span>Total Appointments: ${this.getClientAppointmentCount(client.id)}</span>
                    </div>
                </div>
                <div class="client-actions">
                    <button class="btn-secondary" onclick="adminDashboard.viewClientHistory('${client.id}')">
                        View History
                    </button>
                </div>
            </div>
        `).join('');
    }

    // Utility methods
    formatDateTime(dateTime) {
        if (!dateTime) return 'Invalid date';
        const date = dateTime instanceof Date ? dateTime : new Date(dateTime);
        return date.toLocaleString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    }

    handleQuickAction(action) {
        switch (action) {
            case 'pending-approvals':
                this.showSection('appointments');
                break;
            case 'today-schedule':
                this.showSection('calendar');
                this.goToToday();
                break;
            case 'client-management':
                this.showSection('clients');
                break;
        }
    }

    showLoading(show) {
        const overlay = document.getElementById('loading-overlay');
        if (overlay) {
            overlay.style.display = show ? 'flex' : 'none';
        }
    }

    showSuccess(message) {
        // TODO: Implement toast notification
        alert(message);
    }

    showError(message) {
        // TODO: Implement toast notification
        alert(message);
    }

    hideModal() {
        const modal = document.getElementById('appointment-modal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    // Placeholder methods for features to be implemented
    renderCalendar() {
        console.log('Calendar rendering - to be implemented');
    }

    navigateCalendar(direction) {
        console.log(`Navigate calendar: ${direction}`);
    }

    goToToday() {
        console.log('Go to today - to be implemented');
    }

    populateSettingsForm() {
        console.log('Populate settings form - to be implemented');
    }

    async saveBusinessSettings(e) {
        e.preventDefault();
        console.log('Save business settings - to be implemented');
    }

    async saveBookingSettings(e) {
        e.preventDefault();
        console.log('Save booking settings - to be implemented');
    }

    async saveWorkingHours(e) {
        e.preventDefault();
        console.log('Save working hours - to be implemented');
    }

    async saveNotificationSettings(e) {
        e.preventDefault();
        console.log('Save notification settings - to be implemented');
    }

    showAddAppointmentModal() {
        console.log('Show add appointment modal - to be implemented');
    }

    viewAppointment(id) {
        console.log(`View appointment: ${id}`);
    }

    cancelAppointment(id) {
        console.log(`Cancel appointment: ${id}`);
    }

    viewClientHistory(clientId) {
        console.log(`View client history: ${clientId}`);
    }

    renderRecentActivity() {
        console.log('Render recent activity - to be implemented');
    }

    filterAppointments() {
        this.renderAppointmentsTable();
    }

    destroy() {
        // Cleanup real-time listeners
        this.unsubscribers.forEach(unsubscribe => unsubscribe());
    }
}

// Initialize dashboard when DOM is loaded
let adminDashboard;

document.addEventListener('DOMContentLoaded', () => {
    adminDashboard = new AdminDashboard();
});

// Make adminDashboard globally accessible for onclick handlers
window.adminDashboard = adminDashboard;

export { AdminDashboard };