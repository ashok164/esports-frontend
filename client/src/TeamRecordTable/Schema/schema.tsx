import * as Yup from 'yup';

export const teamValidationSchema = Yup.object().shape({
  teams: Yup.array().of(
    Yup.object().shape({
      teamId: Yup.string()
        .required('Team ID is required')
        .min(1, 'Too short'),
        
      teamName: Yup.string()
        .required('Team Name is required'),
        
      tag: Yup.string()
        .required('Tag is required')
        .max(5, 'Max 5 chars'),
        
      // Updated for actual image file uploads
      teamLogo: Yup.mixed()
        .test('fileRequired', 'Team Logo is required', function (value) {
          if (this.parent?.existingTeamLogo) return true;
          return value && value instanceof FileList && value.length > 0;
        }),
      existingTeamLogo: Yup.string().nullable(),
      existingCountryLogo: Yup.string().nullable(),
        
      // Updated to optionally accept file uploads or remain empty
      countryLogo: Yup.mixed()
        .nullable()
        .notRequired()
        .test('optionalFile', 'Invalid file layout', (value) => {
          // If no file is provided, skip validation. If one is provided, ensure it's a valid FileList
          if (!value || (value instanceof FileList && value.length === 0)) return true;
          return value instanceof FileList;
        }),
    })
  ),
});
