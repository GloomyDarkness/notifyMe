/**
 * Classe responsável pelo gerenciamento de usuários e equipes
 */
class UserManager {
    constructor() {
        this.userModal = new bootstrap.Modal(document.getElementById('userModal'));
        this.teamModal = new bootstrap.Modal(document.getElementById('teamModal'));
        this.currentUser = null;
        this.setupEventListeners();
        this.loadCurrentUser();
    }

    /**
     * Configura os listeners de eventos
     */
    setupEventListeners() {
        // Salvar perfil de usuário
        document.getElementById('saveUserBtn').addEventListener('click', () => this.saveUserProfile());
        
        // Upload de foto
        document.getElementById('userPhotoUpload').addEventListener('change', (e) => this.handlePhotoUpload(e));
        
        // Opção para usar URL de foto
        document.getElementById('usePhotoUrl').addEventListener('click', () => this.togglePhotoUrlInput());
        
        // Salvar equipe
        document.getElementById('saveTeamBtn').addEventListener('click', () => this.saveTeam());
        
        // Adicionar membro à equipe
        document.getElementById('addTeamMemberBtn').addEventListener('click', () => this.addTeamMemberField());
        
        // Abrir modal de perfil
        document.getElementById('userProfileBtn').addEventListener('click', () => this.openUserProfile());
        
        // Abrir modal de equipes
        document.getElementById('teamManagementBtn').addEventListener('click', () => this.openTeamManagement());
        
        // Gerenciar usuários (Admin)
        document.getElementById('manageUsersBtn').addEventListener('click', () => this.openUserManagement());
    }

    /**
     * Carrega o usuário atual
     */
    loadCurrentUser() {
        const userData = localStorage.getItem('notifyMeCurrentUser');
        
        if (userData) {
            this.currentUser = JSON.parse(userData);
            this.updateUserProfileDisplay();
        } else {
            // Se não houver usuário logado, exibe o modal de perfil
            setTimeout(() => {
                this.openUserProfile();
            }, 1000);
        }
    }

    /**
     * Abre o modal de perfil de usuário
     */
    openUserProfile() {
        const userNameInput = document.getElementById('userName');
        const userEmailInput = document.getElementById('userEmail');
        const userRoleInput = document.getElementById('userRole');
        const userPhotoPreview = document.getElementById('userPhotoPreview');
        const userPhotoUrl = document.getElementById('userPhotoUrl');
        
        if (this.currentUser) {
            userNameInput.value = this.currentUser.name || '';
            userEmailInput.value = this.currentUser.email || '';
            userRoleInput.value = this.currentUser.role || '';
            
            if (this.currentUser.photoUrl) {
                userPhotoPreview.src = this.currentUser.photoUrl;
                userPhotoUrl.value = this.currentUser.photoUrl;
                userPhotoPreview.style.display = 'block';
            } else {
                userPhotoPreview.style.display = 'none';
            }
        } else {
            userNameInput.value = '';
            userEmailInput.value = '';
            userRoleInput.value = '';
            userPhotoPreview.style.display = 'none';
            userPhotoUrl.value = '';
        }
        
        this.userModal.show();
    }

    /**
     * Salva o perfil do usuário
     */
    saveUserProfile() {
        const name = document.getElementById('userName').value.trim();
        const email = document.getElementById('userEmail').value.trim();
        const role = document.getElementById('userRole').value.trim();
        const photoUrl = document.getElementById('userPhotoUrl').value.trim();
        
        if (!name) {
            alert('Por favor, informe seu nome.');
            return;
        }
        
        const userData = {
            name,
            email,
            role,
            photoUrl
        };
        
        // Salva o usuário atual
        this.currentUser = userData;
        localStorage.setItem('notifyMeCurrentUser', JSON.stringify(userData));
        
        // Adiciona à lista de usuários se ainda não existir
        this.addUserToSystem(userData);
        
        this.updateUserProfileDisplay();
        this.userModal.hide();
        
        app.columnManager.showToast('Perfil salvo com sucesso!');
    }

    /**
     * Adiciona um usuário ao sistema
     * @param {Object} userData - Dados do usuário
     */
    addUserToSystem(userData) {
        const users = this.getUsers();
        
        // Verifica se o usuário já existe (pelo email)
        const existingUser = users.find(user => user.email === userData.email && userData.email);
        
        if (!existingUser && userData.email) {
            // Gera um ID único
            userData.id = this.generateId();
            users.push(userData);
            localStorage.setItem('notifyMeUsers', JSON.stringify(users));
        } else if (existingUser) {
            // Atualiza os dados do usuário existente
            Object.assign(existingUser, userData);
            localStorage.setItem('notifyMeUsers', JSON.stringify(users));
        }
    }

    /**
     * Obtém a lista de usuários
     * @returns {Array} Lista de usuários
     */
    getUsers() {
        try {
            const users = localStorage.getItem('notifyMeUsers');
            return users ? JSON.parse(users) : [];
        } catch (error) {
            console.error('Erro ao carregar usuários:', error);
            return [];
        }
    }

    /**
     * Obtém a lista de equipes
     * @returns {Array} Lista de equipes
     */
    getTeams() {
        try {
            const teams = localStorage.getItem('notifyMeTeams');
            return teams ? JSON.parse(teams) : [];
        } catch (error) {
            console.error('Erro ao carregar equipes:', error);
            return [];
        }
    }

    /**
     * Atualiza a exibição do perfil do usuário na interface
     */
    updateUserProfileDisplay() {
        const userProfileBtn = document.getElementById('userProfileBtn');
        const userDisplay = document.getElementById('currentUserDisplay');
        
        if (this.currentUser && this.currentUser.name) {
            // Atualiza o botão de perfil
            if (this.currentUser.photoUrl) {
                userProfileBtn.innerHTML = `
                    <img src="${this.currentUser.photoUrl}" alt="${this.currentUser.name}" class="user-avatar">
                `;
            } else {
                const initials = this.getInitials(this.currentUser.name);
                userProfileBtn.innerHTML = `
                    <div class="user-avatar-text">${initials}</div>
                `;
            }
            
            // Atualiza a exibição do usuário
            userDisplay.textContent = this.currentUser.name;
        } else {
            userProfileBtn.innerHTML = `<i class="fas fa-user"></i>`;
            userDisplay.textContent = 'Convidado';
        }
    }

    /**
     * Obtém as iniciais de um nome
     * @param {string} name - Nome completo
     * @returns {string} Iniciais
     */
    getInitials(name) {
        if (!name) return '?';
        
        const parts = name.split(' ').filter(part => part.length > 0);
        
        if (parts.length === 1) {
            return parts[0].charAt(0).toUpperCase();
        } else if (parts.length > 1) {
            return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
        } else {
            return '?';
        }
    }

    /**
     * Gera um ID único
     * @returns {string} ID único
     */
    generateId() {
        return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    }

    /**
     * Manipula o upload de foto
     * @param {Event} event - Evento de alteração do input de arquivo
     */
    handlePhotoUpload(event) {
        const file = event.target.files[0];
        const photoPreview = document.getElementById('userPhotoPreview');
        const photoUrl = document.getElementById('userPhotoUrl');
        
        if (file) {
            // Verifica se é uma imagem
            if (!file.type.startsWith('image/')) {
                alert('Por favor, selecione apenas arquivos de imagem.');
                return;
            }
            
            // Limita o tamanho a 5MB
            if (file.size > 5 * 1024 * 1024) {
                alert('A imagem deve ter no máximo 5MB.');
                return;
            }
            
            const reader = new FileReader();
            reader.onload = e => {
                photoPreview.src = e.target.result;
                photoPreview.style.display = 'block';
                photoUrl.value = e.target.result;
            };
            reader.readAsDataURL(file);
        }
    }

    /**
     * Alterna a entrada de URL da foto
     */
    togglePhotoUrlInput() {
        const urlField = document.getElementById('userPhotoUrlField');
        const preview = document.getElementById('userPhotoPreview');
        const photoUrl = document.getElementById('userPhotoUrl');
        
        if (urlField.style.display === 'none' || !urlField.style.display) {
            urlField.style.display = 'block';
            
            // Foca no campo
            photoUrl.focus();
            
            // Listener para pré-visualizar a imagem quando o URL mudar
            const previewFromUrl = function() {
                const url = photoUrl.value.trim();
                if (url) {
                    preview.src = url;
                    preview.style.display = 'block';
                    preview.onerror = () => {
                        preview.style.display = 'none';
                        alert('Não foi possível carregar a imagem. Verifique o URL.');
                    };
                }
            };
            
            photoUrl.addEventListener('change', previewFromUrl);
            photoUrl.addEventListener('blur', previewFromUrl);
        } else {
            urlField.style.display = 'none';
        }
    }

    /**
     * Abre o modal de gerenciamento de equipes
     */
    openTeamManagement() {
        const teamListElement = document.getElementById('teamList');
        const teams = this.getTeams();
        
        // Limpa a lista
        teamListElement.innerHTML = '';
        
        if (teams.length === 0) {
            teamListElement.innerHTML = '<div class="text-center text-muted my-4">Nenhuma equipe criada ainda.</div>';
        } else {
            teams.forEach(team => {
                const teamElement = document.createElement('div');
                teamElement.className = 'team-item';
                
                let membersHtml = '';
                if (team.members && team.members.length > 0) {
                    membersHtml = team.members.map(memberId => {
                        const member = this.getUserById(memberId);
                        if (!member) return '';
                        
                        return `
                            <div class="team-member" data-user-id="${member.id}">
                                ${this.renderUserAvatar(member, 'sm')}
                                <span>${member.name}</span>
                            </div>
                        `;
                    }).join('');
                }
                
                teamElement.innerHTML = `
                    <div class="team-header">
                        <h5>${team.name}</h5>
                        <div class="team-actions">
                            <button class="btn btn-sm btn-outline-primary edit-team" data-team-id="${team.id}">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-sm btn-outline-danger delete-team" data-team-id="${team.id}">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                    <div class="team-description">${team.description || ''}</div>
                    <div class="team-members">
                        ${membersHtml}
                    </div>
                `;
                
                teamListElement.appendChild(teamElement);
            });
            
            // Adiciona eventos aos botões
            this.setupTeamEvents();
        }
        
        // Exibe o modal
        this.teamModal.show();
    }

    /**
     * Configura os eventos dos botões de equipes
     */
    setupTeamEvents() {
        // Botões de editar equipe
        document.querySelectorAll('.edit-team').forEach(btn => {
            btn.addEventListener('click', () => {
                const teamId = btn.dataset.teamId;
                this.editTeam(teamId);
            });
        });
        
        // Botões de excluir equipe
        document.querySelectorAll('.delete-team').forEach(btn => {
            btn.addEventListener('click', () => {
                const teamId = btn.dataset.teamId;
                this.deleteTeam(teamId);
            });
        });
    }

    /**
     * Edita uma equipe
     * @param {string} teamId - ID da equipe
     */
    editTeam(teamId) {
        // TODO: Implementar edição de equipe
        alert('Funcionalidade em desenvolvimento...');
    }

    /**
     * Exclui uma equipe
     * @param {string} teamId - ID da equipe
     */
    deleteTeam(teamId) {
        if (confirm('Tem certeza que deseja excluir esta equipe?')) {
            const teams = this.getTeams().filter(team => team.id !== teamId);
            localStorage.setItem('notifyMeTeams', JSON.stringify(teams));
            this.openTeamManagement(); // Recarrega a lista
        }
    }

    /**
     * Renderiza o avatar de um usuário
     * @param {Object} user - Dados do usuário
     * @param {string} size - Tamanho do avatar (sm, md, lg)
     * @returns {string} HTML do avatar
     */
    renderUserAvatar(user, size = 'md') {
        if (!user) return '';
        
        const sizeClass = size ? `avatar-${size}` : '';
        
        if (user.photoUrl) {
            return `<img src="${user.photoUrl}" alt="${user.name}" class="user-avatar ${sizeClass}">`;
        } else {
            const initials = this.getInitials(user.name);
            return `<div class="user-avatar-text ${sizeClass}">${initials}</div>`;
        }
    }

    /**
     * Obtém um usuário pelo ID
     * @param {string} userId - ID do usuário
     * @returns {Object|null} Usuário encontrado ou null
     */
    getUserById(userId) {
        const users = this.getUsers();
        return users.find(user => user.id === userId) || null;
    }

    /**
     * Adiciona um campo para novo membro na equipe
     */
    addTeamMemberField() {
        const memberContainer = document.getElementById('teamMembersContainer');
        const memberCount = memberContainer.querySelectorAll('.team-member-field').length;
        
        const memberField = document.createElement('div');
        memberField.className = 'team-member-field mb-2';
        
        const users = this.getUsers();
        let userOptions = '<option value="">Selecione um membro</option>';
        
        users.forEach(user => {
            userOptions += `<option value="${user.id}">${user.name}</option>`;
        });
        
        memberField.innerHTML = `
            <div class="input-group">
                <select class="form-select" name="teamMember${memberCount}">
                    ${userOptions}
                </select>
                <button type="button" class="btn btn-outline-danger remove-member" title="Remover membro">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        
        memberContainer.appendChild(memberField);
        
        // Adiciona evento para remover membro
        memberField.querySelector('.remove-member').addEventListener('click', () => {
            memberField.remove();
        });
    }

    /**
     * Salva uma nova equipe
     */
    saveTeam() {
        const name = document.getElementById('teamName').value.trim();
        const description = document.getElementById('teamDescription').value.trim();
        
        if (!name) {
            alert('Por favor, informe o nome da equipe.');
            return;
        }
        
        // Coleta os membros
        const memberSelects = document.querySelectorAll('#teamMembersContainer select');
        const members = Array.from(memberSelects)
            .map(select => select.value)
            .filter(value => value); // Remove valores vazios
        
        const teamData = {
            id: this.generateId(),
            name,
            description,
            members,
            createdBy: this.currentUser?.id,
            createdAt: new Date().toISOString()
        };
        
        // Salva a equipe
        const teams = this.getTeams();
        teams.push(teamData);
        localStorage.setItem('notifyMeTeams', JSON.stringify(teams));
        
        // Limpa o formulário
        document.getElementById('teamName').value = '';
        document.getElementById('teamDescription').value = '';
        document.getElementById('teamMembersContainer').innerHTML = '';
        
        // Atualiza a lista de equipes
        this.openTeamManagement();
        
        app.columnManager.showToast('Equipe criada com sucesso!');
    }

    /**
     * Abre o modal de gerenciamento de usuários (Admin)
     */
    openUserManagement() {
        // TODO: Implementar gerenciamento de usuários
        alert('Funcionalidade em desenvolvimento...');
    }

    /**
     * Obtém uma lista de todos os membros de todas as equipes
     * @returns {Array} Lista de IDs de usuários
     */
    getAllTeamMembers() {
        const teams = this.getTeams();
        const memberIds = new Set();
        
        teams.forEach(team => {
            if (team.members && team.members.length) {
                team.members.forEach(memberId => {
                    memberIds.add(memberId);
                });
            }
        });
        
        return Array.from(memberIds);
    }

    /**
     * Obtém as equipes de um usuário
     * @param {string} userId - ID do usuário
     * @returns {Array} Lista de equipes
     */
    getUserTeams(userId) {
        if (!userId) return [];
        
        const teams = this.getTeams();
        return teams.filter(team => team.members && team.members.includes(userId));
    }
}