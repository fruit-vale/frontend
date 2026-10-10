import { toast } from 'sonner'
import { FormField } from '@/components/shared/FormField'
import { Hint } from '@/components/shared/EmptyState'
import { PageHeader } from '@/components/shared/PageHeader'
import { SelectField } from '@/components/shared/SelectField'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { useState } from 'react'

const FUSOS = [
  { value: 'america-recife', label: 'América/Recife (UTC-3)' },
  { value: 'america-sao-paulo', label: 'América/São Paulo (UTC-3)' },
]

function Opcao({
  label,
  defaultChecked,
}: {
  label: string
  defaultChecked?: boolean
}) {
  return (
    <Label className="cursor-pointer justify-between gap-4 font-normal">
      <span>{label}</span>
      <Switch defaultChecked={defaultChecked} />
    </Label>
  )
}

// Tela ainda sem endpoint na API: as preferências ficam só na interface.
export default function ConfiguracoesPage() {
  const [fuso, setFuso] = useState('america-recife')

  return (
    <section className="max-w-2xl space-y-6">
      <PageHeader
        eyebrow="Administração"
        title="Configurações"
        description="Preferências gerais da plataforma FruitVale."
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Plataforma</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <FormField label="Nome da plataforma" htmlFor="nome-plataforma">
            <Input id="nome-plataforma" defaultValue="FruitVale" />
          </FormField>
          <FormField label="Fuso horário" htmlFor="fuso">
            <SelectField id="fuso" value={fuso} onValueChange={setFuso} options={FUSOS} />
          </FormField>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Notificações</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Opcao label="Alertar administradores sobre sensores inativos" defaultChecked />
          <Opcao label="Enviar resumo semanal por e-mail" defaultChecked />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Segurança</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Hint>
            Apenas administradores podem alterar as permissões de outros perfis
            de usuário.
          </Hint>
          <Opcao label="Exigir verificação em duas etapas para administradores" />
        </CardContent>
      </Card>

      <Button size="lg" onClick={() => toast.info('Ainda não há endpoint para salvar as configurações.')}>
        Salvar alterações
      </Button>
    </section>
  )
}
