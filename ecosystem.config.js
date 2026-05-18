module.exports = {
  apps: [
    {
      name: "wlive",
      script: "./node_modules/next/dist/bin/next",
      args: "start",
      instances: "max",       // Usa todos os cores disponíveis da CPU (ou defina um número como 2)
      exec_mode: "cluster",   // Habilita o modo cluster para balanceamento de carga nativo
      watch: false,           // Em produção, deixe false para evitar restarts acidentais
      max_memory_restart: "1G", // Reinicia o app caso haja algum memory leak bizarro acima de 1GB
      env: {
        NODE_ENV: "production",
        PORT: 3002    
      }
    }
  ]
};