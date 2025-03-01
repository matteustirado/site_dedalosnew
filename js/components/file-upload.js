/**
 * @file file-upload.js
 * @description Componente para gerenciar upload de arquivos no Dédalos Bar,
 * principalmente para a seção "Trabalhe Conosco" (currículos e documentos).
 */

(function() {
    'use strict';

    const FileUpload = {
        // Configurações padrão
        config: {
            maxFileSizeMB: 5,
            allowedTypes: [
                'application/pdf',
                'application/msword',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'image/jpeg',
                'image/png'
            ],
            allowedExtensions: ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png'],
            uploadEndpoint: '/api/upload',  // Endpoint fictício, ajustar quando back-end for implementado
            selectors: {
                fileInputs: 'input[type="file"]',
                uploadForms: '.upload-form',
                dropZones: '.drop-zone',
                progressBar: '.upload-progress-bar',
                progressText: '.upload-progress-text'
            }
        },

        /**
         * Inicializa o gerenciador de uploads
         * @param {Object} customConfig - Configurações personalizadas (opcional)
         */
        init: function(customConfig = {}) {
            // Mescla configurações padrão com personalizadas
            this.config = { ...this.config, ...customConfig };
            
            // Registra eventos nos elementos DOM
            this.bindEvents();
            
            // Publica evento no barramento para notificar outros componentes
            if (window.EventBus) {
                window.EventBus.publish('fileUpload:initialized');
            }
            
            console.log('FileUpload: Component initialized');
        },

        /**
         * Associa manipuladores de eventos a elementos DOM
         */
        bindEvents: function() {
            // Seleciona todos os inputs de arquivo no documento
            const fileInputs = document.querySelectorAll(this.config.selectors.fileInputs);
            
            // Associa manipuladores de eventos a cada input
            fileInputs.forEach(input => {
                input.addEventListener('change', this.handleFileSelection.bind(this));
                
                // Adiciona atributos ARIA para acessibilidade
                input.setAttribute('aria-label', 'Selecionar arquivo para upload');
                
                // Se houver um formulário pai, registra evento para ele
                const form = input.closest(this.config.selectors.uploadForms);
                if (form) {
                    form.addEventListener('submit', this.handleFormSubmit.bind(this));
                    
                    // Adiciona feedback invisível para leitores de tela
                    const statusEl = document.createElement('div');
                    statusEl.className = 'upload-status';
                    statusEl.setAttribute('aria-live', 'polite');
                    statusEl.style.position = 'absolute';
                    statusEl.style.width = '1px';
                    statusEl.style.height = '1px';
                    statusEl.style.overflow = 'hidden';
                    form.appendChild(statusEl);
                }
            });
            
            // Configura zonas de arrastar e soltar (drag & drop), se existirem
            this.setupDropZones();
        },
        
        /**
         * Configura zonas de arraste para upload de arquivos
         */
        setupDropZones: function() {
            const dropZones = document.querySelectorAll(this.config.selectors.dropZones);
            
            dropZones.forEach(zone => {
                // Eventos de arrastar e soltar
                zone.addEventListener('dragover', e => {
                    e.preventDefault();
                    zone.classList.add('drop-zone--active');
                });
                
                zone.addEventListener('dragleave', e => {
                    e.preventDefault();
                    zone.classList.remove('drop-zone--active');
                });
                
                zone.addEventListener('drop', e => {
                    e.preventDefault();
                    zone.classList.remove('drop-zone--active');
                    
                    // Localiza o input de arquivo associado
                    const fileInput = zone.querySelector('input[type="file"]');
                    if (fileInput && e.dataTransfer.files.length > 0) {
                        // Atualiza o input com os arquivos arrastados
                        fileInput.files = e.dataTransfer.files;
                        
                        // Dispara evento change manualmente
                        const changeEvent = new Event('change', { bubbles: true });
                        fileInput.dispatchEvent(changeEvent);
                    }
                });
                
                // Adiciona indicadores visuais e instruções
                const instructionEl = document.createElement('p');
                instructionEl.className = 'drop-zone__prompt';
                instructionEl.textContent = 'Arraste seu arquivo aqui ou clique para selecionar';
                
                // Só adiciona instruções se não existirem
                if (!zone.querySelector('.drop-zone__prompt')) {
                    zone.appendChild(instructionEl);
                }
            });
        },
        
        /**
         * Manipula a seleção de arquivos pelos inputs
         * @param {Event} event - Evento change do input
         */
        handleFileSelection: function(event) {
            const fileInput = event.target;
            const files = fileInput.files;
            
            if (files.length === 0) return;
            
            // Valida cada arquivo
            const validationResults = Array.from(files).map(file => this.validateFile(file));
            
            // Processa resultados da validação
            const allValid = validationResults.every(result => result.valid);
            const fileNames = Array.from(files).map(file => file.name).join(', ');
            
            // Encontra o elemento de status de upload para o leitor de tela
            const form = fileInput.closest(this.config.selectors.uploadForms);
            const statusEl = form ? form.querySelector('.upload-status') : null;
            
            if (allValid) {
                // Todos os arquivos são válidos
                console.log('FileUpload: Valid files selected', files);
                
                // Atualiza o elemento de feedback visual (pode ser uma lista de arquivos)
                const fileListEl = this.getOrCreateFileList(fileInput);
                this.updateFileList(fileListEl, files);
                
                // Notifica o leitor de tela
                if (statusEl) {
                    statusEl.textContent = `${files.length} arquivo(s) selecionado(s): ${fileNames}`;
                }
                
                // Dispara evento personalizado
                const customEvent = new CustomEvent('fileUpload:filesSelected', {
                    detail: { files, input: fileInput }
                });
                document.dispatchEvent(customEvent);
            } else {
                // Existem arquivos inválidos
                console.warn('FileUpload: Invalid files rejected', validationResults);
                
                // Limpa o input para não manter arquivos inválidos
                fileInput.value = '';
                
                // Notifica o usuário através de uma mensagem de erro
                const errorMessages = validationResults
                    .filter(result => !result.valid)
                    .map(result => result.message);
                
                if (statusEl) {
                    statusEl.textContent = `Erro: ${errorMessages.join('. ')}`;
                }
                
                // Mostra notificação de erro
                this.showError(errorMessages.join('\n'));
            }
        },
        
        /**
         * Manipula o envio do formulário contendo arquivos
         * @param {Event} event - Evento de submit do formulário
         */
        handleFormSubmit: function(event) {
            const form = event.target;
            const fileInputs = form.querySelectorAll('input[type="file"]');
            const hasFiles = Array.from(fileInputs).some(input => input.files.length > 0);
            
            if (!hasFiles) {
                // Nenhum arquivo selecionado, deixa o processamento normal do formulário continuar
                return;
            }
            
            // Previne o envio padrão do formulário
            event.preventDefault();
            
            // Envia os arquivos via AJAX
            this.uploadFiles(form);
        },
        
        /**
         * Cria ou recupera a lista de arquivos associada ao input
         * @param {HTMLElement} fileInput - Input de arquivo
         * @returns {HTMLElement} - Elemento da lista de arquivos
         */
        getOrCreateFileList: function(fileInput) {
            // Busca um elemento de lista existente próximo ao input
            let fileList = fileInput.parentNode.querySelector('.file-list');
            
            // Se não existir, cria um novo
            if (!fileList) {
                fileList = document.createElement('ul');
                fileList.className = 'file-list';
                fileInput.parentNode.insertBefore(fileList, fileInput.nextSibling);
            }
            
            return fileList;
        },
        
        /**
         * Atualiza a lista visual de arquivos selecionados
         * @param {HTMLElement} fileListEl - Elemento da lista de arquivos
         * @param {FileList} files - Lista de arquivos selecionados
         */
        updateFileList: function(fileListEl, files) {
            // Limpa a lista atual
            fileListEl.innerHTML = '';
            
            // Adiciona cada arquivo como um item da lista
            Array.from(files).forEach(file => {
                const listItem = document.createElement('li');
                listItem.className = 'file-item';
                
                // Formata o tamanho do arquivo
                const fileSize = this.formatFileSize(file.size);
                
                // Seleciona o ícone apropriado com base no tipo MIME
                const iconClass = this.getFileIconClass(file.type);
                
                // Cria um botão de remoção
                const removeBtn = document.createElement('button');
                removeBtn.className = 'file-remove-btn';
                removeBtn.innerHTML = '<i class="fas fa-times"></i>';
                removeBtn.setAttribute('aria-label', `Remover arquivo ${file.name}`);
                removeBtn.addEventListener('click', () => this.removeFile(file, fileListEl));
                
                // Estrutura do item da lista
                listItem.innerHTML = `
                    <div class="file-item__icon"><i class="${iconClass}"></i></div>
                    <div class="file-item__info">
                        <span class="file-item__name">${file.name}</span>
                        <span class="file-item__size">${fileSize}</span>
                    </div>
                `;
                
                listItem.appendChild(removeBtn);
                fileListEl.appendChild(listItem);
            });
        },
        
        /**
         * Remove um arquivo da lista de seleção
         * @param {File} fileToRemove - Arquivo a ser removido
         * @param {HTMLElement} fileListEl - Elemento da lista de arquivos
         */
        removeFile: function(fileToRemove, fileListEl) {
            // Obtém o input de arquivo associado
            const fileInput = fileListEl.previousElementSibling;
            
            // Como o FileList é um objeto imutável, cria um novo DataTransfer para manipular
            const dataTransfer = new DataTransfer();
            
            // Adiciona apenas os arquivos que não correspondem ao que estamos removendo
            Array.from(fileInput.files).forEach(file => {
                if (file !== fileToRemove) {
                    dataTransfer.items.add(file);
                }
            });
            
            // Atualiza o valor do input
            fileInput.files = dataTransfer.files;
            
            // Atualiza a lista de arquivos
            this.updateFileList(fileListEl, fileInput.files);
            
            // Notifica leitores de tela
            const form = fileInput.closest(this.config.selectors.uploadForms);
            const statusEl = form ? form.querySelector('.upload-status') : null;
            
            if (statusEl) {
                statusEl.textContent = `Arquivo ${fileToRemove.name} removido.`;
            }
        },
        
        /**
         * Valida um arquivo de acordo com as configurações
         * @param {File} file - Arquivo a ser validado
         * @returns {Object} - Resultado da validação { valid, message }
         */
        validateFile: function(file) {
            // Verifica o tamanho do arquivo
            const fileSizeMB = file.size / (1024 * 1024);
            if (fileSizeMB > this.config.maxFileSizeMB) {
                return {
                    valid: false,
                    message: `O arquivo ${file.name} excede o tamanho máximo de ${this.config.maxFileSizeMB}MB.`
                };
            }
            
            // Verifica o tipo MIME
            const fileType = file.type;
            const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
            
            const isValidType = this.config.allowedTypes.includes(fileType);
            const isValidExtension = this.config.allowedExtensions.includes(fileExtension);
            
            if (!isValidType && !isValidExtension) {
                return {
                    valid: false,
                    message: `O arquivo ${file.name} não é de um tipo permitido. Tipos permitidos: ${this.config.allowedExtensions.join(', ')}`
                };
            }
            
            // Arquivo válido
            return { valid: true };
        },
        
        /**
         * Realiza o upload de arquivos via AJAX
         * @param {HTMLFormElement} form - Formulário contendo os arquivos
         */
        uploadFiles: function(form) {
            // Cria um FormData para envio AJAX
            const formData = new FormData(form);
            
            // Adiciona informações extras se necessário
            formData.append('uploadTimestamp', Date.now());
            
            // Encontra ou cria elementos de progresso
            let progressBar = form.querySelector(this.config.selectors.progressBar);
            let progressText = form.querySelector(this.config.selectors.progressText);
            
            if (!progressBar) {
                const progressContainer = document.createElement('div');
                progressContainer.className = 'upload-progress';
                
                progressBar = document.createElement('div');
                progressBar.className = 'upload-progress-bar';
                
                progressText = document.createElement('div');
                progressText.className = 'upload-progress-text';
                progressText.textContent = 'Preparando upload...';
                
                progressContainer.appendChild(progressBar);
                progressContainer.appendChild(progressText);
                form.appendChild(progressContainer);
            }
            
            // Atualiza o status para leitores de tela
            const statusEl = form.querySelector('.upload-status');
            if (statusEl) {
                statusEl.textContent = 'Iniciando upload. Por favor, aguarde.';
            }
            
            // Configura o XMLHttpRequest
            const xhr = new XMLHttpRequest();
            
            // Acompanha o progresso do upload
            xhr.upload.addEventListener('progress', event => {
                if (event.lengthComputable) {
                    const percentComplete = Math.round((event.loaded / event.total) * 100);
                    
                    // Atualiza a barra de progresso
                    progressBar.style.width = percentComplete + '%';
                    progressText.textContent = `${percentComplete}% carregado`;
                    
                    // Atualiza para leitores de tela
                    if (statusEl) {
                        statusEl.textContent = `${percentComplete}% do upload concluído`;
                    }
                }
            });
            
            // Manipula o término do upload
            xhr.addEventListener('load', () => {
                if (xhr.status >= 200 && xhr.status < 400) {
                    // Upload bem-sucedido
                    progressBar.style.width = '100%';
                    progressBar.classList.add('upload-progress-bar--success');
                    progressText.textContent = 'Upload concluído com sucesso!';
                    
                    // Atualiza para leitores de tela
                    if (statusEl) {
                        statusEl.textContent = 'Upload concluído com sucesso.';
                    }
                    
                    // Limpa os campos de arquivo após upload bem-sucedido
                    Array.from(form.querySelectorAll('input[type="file"]')).forEach(input => {
                        input.value = '';
                        const fileList = input.parentNode.querySelector('.file-list');
                        if (fileList) {
                            fileList.innerHTML = '';
                        }
                    });
                    
                    // Mostra notificação de sucesso
                    this.showSuccess('Seus arquivos foram enviados com sucesso!');
                    
                    // Dispara evento personalizado
                    const customEvent = new CustomEvent('fileUpload:complete', {
                        detail: { success: true, response: xhr.response }
                    });
                    document.dispatchEvent(customEvent);
                    
                    // Redireciona ou mostra uma mensagem após o upload, se necessário
                    setTimeout(() => {
                        const uploadProgress = form.querySelector('.upload-progress');
                        if (uploadProgress) {
                            uploadProgress.classList.add('upload-progress--fade-out');
                            
                            // Remove após animação de fade-out
                            setTimeout(() => {
                                uploadProgress.remove();
                            }, 1000);
                        }
                    }, 3000);
                } else {
                    // Erro no upload
                    this.handleUploadError(xhr, progressBar, progressText, statusEl);
                }
            });
            
            // Manipula erros de rede
            xhr.addEventListener('error', () => {
                this.handleUploadError(xhr, progressBar, progressText, statusEl);
            });
            
            // Manipula o cancelamento
            xhr.addEventListener('abort', () => {
                progressBar.style.width = '0%';
                progressBar.classList.add('upload-progress-bar--cancelled');
                progressText.textContent = 'Upload cancelado';
                
                // Atualiza para leitores de tela
                if (statusEl) {
                    statusEl.textContent = 'O upload foi cancelado.';
                }
            });
            
            // Configura e inicia a requisição
            xhr.open('POST', this.config.uploadEndpoint, true);
            xhr.send(formData);
            
            // Armazena a referência para acesso posterior (cancelamento, etc.)
            form.uploadXHR = xhr;
        },
        
        /**
         * Manipula erros durante o upload
         * @param {XMLHttpRequest} xhr - Objeto XHR que realizou a requisição
         * @param {HTMLElement} progressBar - Elemento da barra de progresso
         * @param {HTMLElement} progressText - Elemento de texto do progresso
         * @param {HTMLElement} statusEl - Elemento de status para acessibilidade
         */
        handleUploadError: function(xhr, progressBar, progressText, statusEl) {
            progressBar.classList.add('upload-progress-bar--error');
            progressText.textContent = 'Erro no upload. Tente novamente.';
            
            let errorMessage = 'Ocorreu um erro durante o upload dos arquivos. Por favor, tente novamente.';
            
            // Tenta extrair mensagem de erro mais específica da resposta
            if (xhr.responseText) {
                try {
                    const response = JSON.parse(xhr.responseText);
                    if (response.message) {
                        errorMessage = response.message;
                    }
                } catch (e) {
                    // Se não conseguir analisar a resposta, mantém a mensagem padrão
                    console.error('Error parsing error response:', e);
                }
            }
            
            // Atualiza para leitores de tela
            if (statusEl) {
                statusEl.textContent = `Erro: ${errorMessage}`;
            }
            
            // Mostra notificação de erro
            this.showError(errorMessage);
            
            // Dispara evento personalizado
            const customEvent = new CustomEvent('fileUpload:complete', {
                detail: { success: false, error: errorMessage }
            });
            document.dispatchEvent(customEvent);
        },
        
        /**
         * Obtém a classe de ícone FontAwesome apropriada para o tipo de arquivo
         * @param {string} fileType - Tipo MIME do arquivo
         * @returns {string} - Classe CSS para o ícone
         */
        getFileIconClass: function(fileType) {
            if (fileType.includes('pdf')) {
                return 'fas fa-file-pdf';
            } else if (fileType.includes('word') || fileType.includes('doc')) {
                return 'fas fa-file-word';
            } else if (fileType.includes('image')) {
                return 'fas fa-file-image';
            } else if (fileType.includes('text')) {
                return 'fas fa-file-alt';
            } else if (fileType.includes('zip') || fileType.includes('compressed')) {
                return 'fas fa-file-archive';
            } else {
                return 'fas fa-file';
            }
        },
        
        /**
         * Formata o tamanho do arquivo para exibição amigável
         * @param {number} bytes - Tamanho em bytes
         * @returns {string} - Tamanho formatado (ex: "2.5 MB")
         */
        formatFileSize: function(bytes) {
            if (bytes === 0) return '0 Bytes';
            
            const k = 1024;
            const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            
            return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
        },
        
        /**
         * Exibe uma mensagem de erro para o usuário
         * @param {string} message - Mensagem de erro a ser exibida
         */
        showError: function(message) {
            // Verifica se existe um componente de notificação global
            if (window.Notifications && typeof window.Notifications.showError === 'function') {
                window.Notifications.showError(message);
                return;
            }
            
            // Implementação fallback usando alert (não recomendado para produção)
            console.error('FileUpload Error:', message);
            alert('Erro: ' + message);
        },
        
        /**
         * Exibe uma mensagem de sucesso para o usuário
         * @param {string} message - Mensagem de sucesso a ser exibida
         */
        showSuccess: function(message) {
            // Verifica se existe um componente de notificação global
            if (window.Notifications && typeof window.Notifications.showSuccess === 'function') {
                window.Notifications.showSuccess(message);
                return;
            }
            
            // Implementação fallback usando console (não visível para usuários)
            console.log('FileUpload Success:', message);
            // Não usa alert para mensagens de sucesso, pois é intrusivo
        }
    };

    // Exporta a API pública
    window.FileUpload = FileUpload;

    // Inicializa o componente quando o DOM estiver pronto
    document.addEventListener('DOMContentLoaded', () => {
        FileUpload.init();
    });
})();
