# QAluno
Aplicativo não-oficial do Q-Acadêmico.

![React Native](https://img.shields.io/badge/react_native-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)

⚠ No momento, funciona apenas para o IFCE, testado nos cursos técnicos integrados.

Horários de Aula           |  Disciplinas e Notas      |  Material de Aula
:-------------------------:|:-------------------------:|:-------------------------:
![Horários de Aula](https://cdn.discordapp.com/attachments/852655974124879944/1203746303222227015/Screenshot_20240204_135524_QAluno.jpg)|![Disciplinas e Notas](https://cdn.discordapp.com/attachments/852655974124879944/1203746302702125067/Screenshot_20240204_135339_QAluno.jpg)|![Material de Aula](https://cdn.discordapp.com/attachments/852655974124879944/1203746302957981696/Screenshot_20240204_135446_QAluno.jpg)

## Desenvolvimento
Iniciar o aplicativo em modo desenvolvimento: `yarn start` ou `npm run start`

Gerar APKs para produção: `yarn android --mode release` ou `npm run android -- --mode="release"`

Para gerar APKs de produção, você precisa [gerar uma keystore](https://reactnative.dev/docs/signed-apk-android#generating-an-upload-key) e inserir as seguintes variáveis no `gradle.properties` de acordo com a sua keystore:
- `QALUNO_UPLOAD_STORE_FILE`
- `QALUNO_UPLOAD_KEY_ALIAS`
- `QALUNO_UPLOAD_STORE_PASSWORD`
- `QALUNO_UPLOAD_KEY_PASSWORD`
