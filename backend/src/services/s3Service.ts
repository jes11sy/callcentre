import AWS from 'aws-sdk';

class S3Service {
  private s3: AWS.S3;
  private bucket: string;

  constructor() {
    // Читаем секреты из Docker Secrets или fallback на env
    const s3AccessKey = this.readSecret('s3_access_key') || process.env.S3_ACCESS_KEY || 'G0Q8KYB00336TBRJ7CLF';
    const s3SecretKey = this.readSecret('s3_secret_key') || process.env.S3_SECRET_KEY || '1XafQAT9DKRWs4YImAU2XfkX7VAb1LlXDiH2Ks6Y';
    
    this.bucket = process.env.S3_BUCKET || 'f7eead03-crmfiles';
    
    this.s3 = new AWS.S3({
      endpoint: process.env.S3_ENDPOINT || 'https://s3.twcstorage.ru',
      accessKeyId: s3AccessKey,
      secretAccessKey: s3SecretKey,
      region: process.env.S3_REGION || 'ru-1',
      s3ForcePathStyle: true, // Нужно для совместимости с S3-подобными сервисами
      signatureVersion: 'v4'
    });

    console.log('🪣 S3 Service инициализирован:', {
      endpoint: this.s3.config.endpoint,
      bucket: this.bucket,
      region: this.s3.config.region,
      accessKeySource: s3AccessKey.startsWith('G0Q8KYB') ? 'default' : 'secret'
    });
  }

  /**
   * Читает Docker Secret из файла
   */
  private readSecret(secretName: string): string | null {
    try {
      const fs = require('fs');
      const secretPath = `/run/secrets/${secretName}`;
      if (fs.existsSync(secretPath)) {
        return fs.readFileSync(secretPath, 'utf8').trim();
      }
      return null;
    } catch (error) {
      console.warn(`⚠️ Не удалось прочитать секрет ${secretName}:`, error);
      return null;
    }
  }

  /**
   * Загружает файл записи в S3
   */
  async uploadRecording(filename: string, content: Buffer): Promise<string> {
    try {
      const key = `recordings/${filename}`;
      
      console.log(`☁️ Загружаем файл в S3: ${key}`);
      
      const result = await this.s3.upload({
        Bucket: this.bucket,
        Key: key,
        Body: content,
        ContentType: 'audio/mpeg',
        ACL: 'private'
      }).promise();

      console.log(`✅ Файл успешно загружен в S3: ${result.Location}`);
      return key; // Возвращаем ключ для сохранения в БД
    } catch (error) {
      console.error('❌ Ошибка загрузки в S3:', error);
      throw error;
    }
  }

  /**
   * Получает подписанный URL для скачивания файла
   */
  async getRecordingUrl(key: string): Promise<string> {
    try {
      const url = this.s3.getSignedUrl('getObject', {
        Bucket: this.bucket,
        Key: key,
        Expires: 3600 // URL действует 1 час
      });

      console.log(`🔗 Создан подписанный URL для: ${key}`);
      return url;
    } catch (error) {
      console.error('❌ Ошибка создания подписанного URL:', error);
      throw error;
    }
  }

  /**
   * Скачивает файл из S3
   */
  async downloadRecording(key: string): Promise<Buffer> {
    try {
      console.log(`⬇️ Скачиваем файл из S3: ${key}`);
      
      const result = await this.s3.getObject({
        Bucket: this.bucket,
        Key: key
      }).promise();

      return result.Body as Buffer;
    } catch (error) {
      console.error('❌ Ошибка скачивания из S3:', error);
      throw error;
    }
  }

  /**
   * Проверяет существование файла в S3
   */
  async fileExists(key: string): Promise<boolean> {
    try {
      await this.s3.headObject({
        Bucket: this.bucket,
        Key: key
      }).promise();
      return true;
    } catch (error: any) {
      if (error.code === 'NotFound') {
        return false;
      }
      throw error;
    }
  }

  /**
   * Удаляет файл из S3
   */
  async deleteRecording(key: string): Promise<void> {
    try {
      console.log(`🗑️ Удаляем файл из S3: ${key}`);
      
      await this.s3.deleteObject({
        Bucket: this.bucket,
        Key: key
      }).promise();

      console.log(`✅ Файл удален из S3: ${key}`);
    } catch (error) {
      console.error('❌ Ошибка удаления из S3:', error);
      throw error;
    }
  }
}

export default new S3Service();
