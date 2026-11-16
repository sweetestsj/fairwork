// Test service data validation edge cases
const Service = require('../models/Service');

describe('Service Data Validation', () => {
  describe('Estimated Duration Validation', () => {
    it('should reject non-numeric strings like "123abc"', () => {
      expect(() => {
        Service.validateServiceData({
          name: 'Test Service',
          description: 'A test service',
          category: 'Cleaning',
          estimated_duration: '123abc'
        });
      }).toThrow('Estimated duration must be a valid number');
    });

    it('should reject NaN values', () => {
      expect(() => {
        Service.validateServiceData({
          name: 'Test Service',
          description: 'A test service',
          category: 'Cleaning',
          estimated_duration: NaN
        });
      }).toThrow('Estimated duration must be a valid number');
    });

    it('should reject Infinity values', () => {
      expect(() => {
        Service.validateServiceData({
          name: 'Test Service',
          description: 'A test service',
          category: 'Cleaning',
          estimated_duration: Infinity
        });
      }).toThrow('Estimated duration must be a valid number');
    });

    it('should accept valid numeric values', () => {
      expect(() => {
        Service.validateServiceData({
          name: 'Test Service',
          description: 'A test service',
          category: 'Cleaning',
          estimated_duration: 60
        });
      }).not.toThrow();
    });

    it('should accept valid decimal values', () => {
      expect(() => {
        Service.validateServiceData({
          name: 'Test Service',
          description: 'A test service',
          category: 'Cleaning',
          estimated_duration: 45.5
        });
      }).not.toThrow();
    });
  });
});