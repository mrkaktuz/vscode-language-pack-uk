# Український мовний пакет для Visual Studio Code

Цей мовний пакет створено у зв'язку з тим, що Microsoft, схоже, не бажає додавати офіційну підтримку української мови для інтерфейсу в Visual Studio Code.

Переклад неофіційний, створений переважно за домомогою інструментів машинного перекладу. Тому вітається твоя участь в покращенні перекладу, інструкції дивись [нижче](#участь).

_Періодичні оновлення плануються, але не гарантуються._

Актуальна версія мовного пакету та інструкція щодо його використання доступні в [Visual Studio Marketplace](https://marketplace.visualstudio.com/items?itemName=MrKAKTUZ.vscode-language-pack-uk).

**Підтримати, сказати "Дякую" або задонатити на оплату сервера та послуг ШІ можна через [Монобанку](https://send.monobank.ua/jar/39QFXyjABk).**


## Участь

Цей репозиторій містить XLIFF файли (_XML Localization Interchange File Format_), які використовуються для зберігання перекладених текстів та їх оригіналів. Ваша допомога у покращенні якості перекладу є надзвичайно цінною для україномовної спільноти.

### Що таке XLIFF?

XLIFF - це стандартний формат файлів, який використовується для обміну локалізаційними даними між різними інструментами перекладу. Файли XLIFF мають розширення `.xlf` або `.xliff` і містять оригінальний текст (`source`), його переклад (`target`) та інколи контекст (`note`).

### Як допомогти з перекладом

#### 1. Підготовка

1. Створіть fork репозиторію (натисніть кнопку `Fork` у верхньому правому куті сторінки цього репозиторію).
2. Клонуйте ваш fork на локальний комп'ютер:
   ```
   git clone https://github.com/ваш-username/назва-репозиторію.git
   cd назва-репозиторію
   ```
3. Створіть нову гілку для ваших змін:
   ```
   git checkout -b покращення-перекладу
   ```

#### 2. Редагування файлів XLIFF

Ви можете редагувати XLIFF файли одним із таких способів:

##### А. Використання спеціалізованих редакторів XLIFF

Для зручнішого редагування рекомендуємо використовувати спеціалізовані програми:
- [Poedit](https://poedit.net/) - зручний редактор з підтримкою XLIFF
- [Virtaal](https://virtaal.translatehouse.org/) - безкоштовний крос-платформний редактор
- [Lokalize](https://apps.kde.org/lokalize/) - інструмент для KDE
- [OmegaT](https://omegat.org/) - безкоштовний інструмент перекладу з підтримкою XLIFF

##### Б. Ручне редагування як XML

Якщо у вас немає спеціалізованих інструментів, можете відкрити файли у будь-якому текстовому редакторі, який підтримує XML (VS Code, Sublime Text, тощо).

Структура XLIFF файлу виглядає приблизно так:

```xml
<xliff version="1.2" xmlns="urn:oasis:names:tc:xliff:document:1.2">
  <file original="some/path/to/file" source-language="en" target-language="uk" datatype="plaintext">
    <body>
      <trans-unit id="some id">
        <source xml:lang="en">Hello, world!</source>
        <note>Контекст (опис) елементу, є не завжди</note>
        <target>Привіт, світе!</target>
      </trans-unit>
      <!-- більше trans-unit елементів -->
    </body>
  </file>
</xliff>
```

Для перекладу чи виправлення змінюйте тільки вміст елементів `<target>`.

#### 3. Правила перекладу

1. **Зберігайте форматування**: Якщо в оригіналі є теги форматування (наприклад, `<b>`, `<i>`, `{0}`, `%s`), зберігайте їх у перекладі.
2. **Зберігайте контекст**: Перекладайте з урахуванням контексту, інколи можна заглянути у [вихідний код VSCode](https://github.com/microsoft/vscode), щоб зрозуміти, де використовується текст. Також можна переглянути інші локалізації [тут](https://github.com/microsoft/vscode-loc).
3. **Дотримуйтесь узгодженої термінології**: Використовуйте вже усталені переклади термінів.
4. **Не перекладайте**:
   - Назви команд (якщо не вказано інше)
   - Власні назви, які не мають офіційного перекладу українською
   - Технічні ідентифікатори

#### 4. Відправка змін

1. Збережіть зміни та додайте їх до git:
   ```
   git add змінені-файли.xlf
   ```
2. Створіть коміт з описовим повідомленням:
   ```
   git commit -m "Покращено переклад розділу X"
   ```
3. Надішліть зміни до вашого fork:
   ```
   git push origin покращення-перекладу
   ```
4. Створіть Pull Request у головний репозиторій через GitHub інтерфейс.

#### 5. Перевірка перекладу

Перед відправкою pull request, переконайтеся, що:
- Файл коректно відкривається у редакторі XLIFF (перевірте валідність XML)
- Ви не видалили жодних важливих тегів та атрибутів форматування
- Ваш переклад відповідає оригіналу за змістом
- У перекладі немає орфографічних та граматичних помилок

#### Додаткові ресурси

- [Офіційна документація XLIFF](https://docs.oasis-open.org/xliff/xliff-core/v2.1/os/xliff-core-v2.1-os.html)
- [Правила українського правопису](https://pravopys.net/)

Якщо у вас виникли питання щодо перекладу або процесу внесення змін, будь ласка, створіть issue у репозиторії.

Дякуємо за ваш внесок у розвиток україномовного IT середовища!


## Ліцензія

На переклад поширюється [модифікована ліцензія MIT](https://github.com/mrkaktuz/vscode-language-pack-uk/blob/main/LICENSE.md).


<p align="center"><strong>🇺🇦 Слава Україні! 🇺🇦</strong></p>