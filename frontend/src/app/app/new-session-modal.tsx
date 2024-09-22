import { useForm } from '@mantine/form';

export const NewSessionModal = () => {
  const form = useForm({
    initialValues: {
      name: '',
    },
  });
};
