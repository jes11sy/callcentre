import AWS from 'aws-sdk';

class S3Service {
  private s3: AWS.S3;
  private bucket: string;

  constructor() {
    this.bucket = process.env.S3_BUCKET || 'f7eead03-crmfiles';
    
    this.s3 = new AWS.S3({
      endpoint: process.env.S3_ENDPOINT || 'https://s3.twcstorage.ru',
      accessKeyId: process.env.S3_ACCESS_KEY || 'G0Q8KYB00336TBRJ7CLF',
      secretAccessKey: process.env.S3_SECRET_KEY || '1XafQAT9DKRWs4YImAU2XfkX7VAb1LlXDiH2Ks6Y',
      region: process.env.S3_REGION || 'ru-1',
      s3ForcePathStyle: true, // Нужно для совместимости с S3-подобными сервисами
      signatureVersion: 'v4'
    });

    console.log('🪣 S3 Service инициализирован:', {
      endpoint: this.s3.config.endpoint,
      bucket: this.bucket,
      region: this.s3.config.region,
      hasAccessKey: !!process.env.S3_ACCESS_KEY
    });
  }

  /**
   * Загружает файл записи в S3
   */
  async uploadRecording(filename: string, content: Buffer): Promise<string> {
    try {
      const key = `callcentre/recording_path/${filename}`;
      
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

  /**
   * Загружает фото паспорта сотрудника в S3
   */
  async uploadPassport(filename: string, content: Buffer): Promise<string> {
    try {
      const key = `callcentre/operator_passport/${filename}`;
      
      console.log(`📄 Загружаем фото паспорта в S3: ${key}`);
      
      const result = await this.s3.upload({
        Bucket: this.bucket,
        Key: key,
        Body: content,
        ContentType: 'image/jpeg',
        ACL: 'private'
      }).promise();

      console.log(`✅ Фото паспорта успешно загружено в S3: ${result.Location}`);
      return key;
    } catch (error) {
      console.error('❌ Ошибка загрузки фото паспорта в S3:', error);
      throw error;
    }
  }

  /**
   * Загружает фото договора сотрудника в S3
   */
  async uploadContract(filename: string, content: Buffer): Promise<string> {
    try {
      const key = `callcentre/operator_contract/${filename}`;
      
      console.log(`📋 Загружаем фото договора в S3: ${key}`);
      
      const result = await this.s3.upload({
        Bucket: this.bucket,
        Key: key,
        Body: content,
        ContentType: 'image/jpeg',
        ACL: 'private'
      }).promise();

      console.log(`✅ Фото договора успешно загружено в S3: ${result.Location}`);
      return key;
    } catch (error) {
      console.error('❌ Ошибка загрузки фото договора в S3:', error);
      throw error;
    }
  }

  /**
   * Получает подписанный URL для просмотра фото паспорта/договора
   */
  async getEmployeeFileUrl(key: string): Promise<string> {
    try {
      console.log(`🔗 Создаем подписанный URL для файла сотрудника: ${key}`);
      
      const url = this.s3.getSignedUrl('getObject', {
        Bucket: this.bucket,
        Key: key,
        Expires: 3600 // URL действует 1 час
      });

      return url;
    } catch (error) {
      console.error('❌ Ошибка создания URL для файла сотрудника:', error);
      throw error;
    }
  }
}

export default new S3Service();
