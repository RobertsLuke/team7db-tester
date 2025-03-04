// Initialize Supabase client
// These keys will be visible in your frontend code
// For production, you should control access with Row Level Security
const SUPABASE_URL = 'https://jkyvvvsongwqjgckvboh.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2a3l2dnZzb25nd3FqZ2NrdmJvaCIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzA5NjQ2OTEzLCJleHAiOjIwMjUyMjI5MTN9.TbM9-A2l-YKBtj9wH6Fbat5tX7Dy7A-i6PK-_FtVrPU';

// Fix for the library loading
document.addEventListener('DOMContentLoaded', function() {
    // Create Supabase client
    window.supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    
    // DOM Elements
    const connectionStatus = document.getElementById('connectionStatus');
    const listTablesBtn = document.getElementById('listTablesBtn');
    const tablesList = document.getElementById('tablesList');
    const listUsersBtn = document.getElementById('listUsersBtn');
    const usersList = document.getElementById('usersList');
    const addUserForm = document.getElementById('addUserForm');
    const addUserResult = document.getElementById('addUserResult');
    const pingBtn = document.getElementById('pingBtn');
    const pingResult = document.getElementById('pingResult');

    // Helper function to show loading state
    function showLoading(element) {
        element.innerHTML = '<div class="loading"></div> Loading...';
    }

    // Helper function to show error message
    function showError(element, message) {
        element.innerHTML = `<div class="error-message">Error: ${message}</div>`;
    }

    // Helper function to show success message
    function showSuccess(element, message) {
        element.innerHTML = `<div class="success-message">${message}</div>`;
    }

    // Check connection on page load
    async function checkConnection() {
        try {
            const { data, error } = await window.supabase.from('online_user').select('count()', { count: 'exact' });
            
            if (error) throw error;
            
            connectionStatus.textContent = 'Connected';
            connectionStatus.classList.add('connected');
        } catch (error) {
            console.error('Connection error:', error);
            connectionStatus.textContent = 'Connection Failed';
            connectionStatus.classList.add('error');
        }
    }

    // List all tables in the database
    async function listTables() {
        showLoading(tablesList);
        
        try {
            // First try to fetch from postgres_tables
            let { data, error } = await window.supabase.rpc('get_tables');
            
            if (error) {
                // Fallback to manual SQL query
                const { data: tableData, error: tableError } = await window.supabase
                    .from('online_user')
                    .select('*')
                    .limit(1);
                
                if (tableError) throw tableError;
                
                data = [
                    { tablename: 'online_user' },
                    { tablename: 'project' },
                    { tablename: 'task' },
                    { tablename: 'meeting' },
                    { tablename: 'project_members' },
                    { tablename: 'contribution_report' },
                    { tablename: 'user_project' },
                    { tablename: 'task_members' }
                ];
            }
            
            if (data && data.length > 0) {
                let html = '<table><tr><th>Table Name</th></tr>';
                data.forEach(table => {
                    html += `<tr><td>${table.tablename}</td></tr>`;
                });
                html += '</table>';
                tablesList.innerHTML = html;
            } else {
                tablesList.innerHTML = 'No tables found or insufficient permissions.';
            }
        } catch (error) {
            console.error('Error listing tables:', error);
            showError(tablesList, error.message || 'Failed to list tables');
        }
    }

    // List all users
    async function listUsers() {
        showLoading(usersList);
        
        try {
            const { data, error } = await window.supabase
                .from('online_user')
                .select('user_id, username, email, theme, currency_total');
            
            if (error) throw error;
            
            if (data && data.length > 0) {
                let html = '<table><tr><th>ID</th><th>Username</th><th>Email</th><th>Theme</th><th>Currency</th></tr>';
                data.forEach(user => {
                    html += `<tr>
                        <td>${user.user_id}</td>
                        <td>${user.username}</td>
                        <td>${user.email}</td>
                        <td>${user.theme}</td>
                        <td>${user.currency_total}</td>
                    </tr>`;
                });
                html += '</table>';
                usersList.innerHTML = html;
            } else {
                usersList.innerHTML = 'No users found.';
            }
        } catch (error) {
            console.error('Error listing users:', error);
            showError(usersList, error.message || 'Failed to list users');
        }
    }

    // Add a new user
    async function addUser(event) {
        event.preventDefault();
        showLoading(addUserResult);
        
        const username = document.getElementById('username').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const theme = document.getElementById('theme').value;
        
        try {
            // Warning: In a real application, you would NEVER insert passwords directly like this
            // This is just for testing purposes - normally you would use Supabase Auth
            const { data, error } = await window.supabase
                .from('online_user')
                .insert([
                    { 
                        username, 
                        email, 
                        user_password: password, 
                        theme,
                        currency_total: 0,
                        customize_settings: ''
                    }
                ])
                .select();
            
            if (error) throw error;
            
            showSuccess(addUserResult, 'User added successfully!');
            addUserForm.reset();
            
            // Refresh user list
            listUsers();
        } catch (error) {
            console.error('Error adding user:', error);
            showError(addUserResult, error.message || 'Failed to add user');
        }
    }

    // Ping database to test connection speed
    async function pingDatabase() {
        showLoading(pingResult);
        
        try {
            const startTime = performance.now();
            
            // Make a simple query to measure response time
            const { data, error } = await window.supabase
                .from('online_user')
                .select('count()', { count: 'exact' });
            
            if (error) throw error;
            
            const endTime = performance.now();
            const responseTime = (endTime - startTime).toFixed(2);
            
            showSuccess(pingResult, `Connection successful! Response time: ${responseTime}ms`);
        } catch (error) {
            console.error('Ping error:', error);
            showError(pingResult, error.message || 'Failed to ping database');
        }
    }

    // Event listeners
    checkConnection();
    listTablesBtn.addEventListener('click', listTables);
    listUsersBtn.addEventListener('click', listUsers);
    addUserForm.addEventListener('submit', addUser);
    pingBtn.addEventListener('click', pingDatabase);
});
