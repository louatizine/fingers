Namespace VBNETSample
	Partial Class SettingsForm
		''' <summary>
		''' Required designer variable.
		''' </summary>
		Private components As System.ComponentModel.IContainer = Nothing

		''' <summary>
		''' Clean up any resources being used.
		''' </summary>
		''' <param name="disposing">true if managed resources should be disposed; otherwise, false.</param>
		Protected Overloads Overrides Sub Dispose(ByVal disposing As Boolean)
			If disposing AndAlso (components IsNot Nothing) Then
				components.Dispose()
			End If
			MyBase.Dispose(disposing)
		End Sub

#Region "Windows Form Designer generated code"

		''' <summary>
		''' Required method for Designer support - do not modify
		''' the contents of this method with the code editor.
		''' </summary>
		Private Sub InitializeComponent()
			Me.components = New System.ComponentModel.Container
			Me.btnCancel = New System.Windows.Forms.Button
			Me.btnOK = New System.Windows.Forms.Button
			Me.label1 = New System.Windows.Forms.Label
			Me.label2 = New System.Windows.Forms.Label
			Me.nudQualityThreshold = New System.Windows.Forms.NumericUpDown
			Me.cbMatchingThreshold = New System.Windows.Forms.ComboBox
			Me.errorProvider1 = New System.Windows.Forms.ErrorProvider(Me.components)
			Me.label3 = New System.Windows.Forms.Label
			CType(Me.nudQualityThreshold, System.ComponentModel.ISupportInitialize).BeginInit()
			CType(Me.errorProvider1, System.ComponentModel.ISupportInitialize).BeginInit()
			Me.SuspendLayout()
			'
			'btnCancel
			'
			Me.btnCancel.DialogResult = System.Windows.Forms.DialogResult.Cancel
			Me.btnCancel.Location = New System.Drawing.Point(194, 109)
			Me.btnCancel.Name = "btnCancel"
			Me.btnCancel.Size = New System.Drawing.Size(75, 23)
			Me.btnCancel.TabIndex = 5
			Me.btnCancel.Text = "Cancel"
			Me.btnCancel.UseVisualStyleBackColor = True
			'
			'btnOK
			'
			Me.btnOK.DialogResult = System.Windows.Forms.DialogResult.OK
			Me.btnOK.Location = New System.Drawing.Point(113, 109)
			Me.btnOK.Name = "btnOK"
			Me.btnOK.Size = New System.Drawing.Size(75, 23)
			Me.btnOK.TabIndex = 4
			Me.btnOK.Text = "OK"
			Me.btnOK.UseVisualStyleBackColor = True
			'
			'label1
			'
			Me.label1.AutoSize = True
			Me.label1.Location = New System.Drawing.Point(6, 18)
			Me.label1.Name = "label1"
			Me.label1.Size = New System.Drawing.Size(88, 13)
			Me.label1.TabIndex = 0
			Me.label1.Text = "Quality threshold:"
			'
			'label2
			'
			Me.label2.AutoSize = True
			Me.label2.Location = New System.Drawing.Point(6, 84)
			Me.label2.Name = "label2"
			Me.label2.Size = New System.Drawing.Size(134, 13)
			Me.label2.TabIndex = 2
			Me.label2.Text = "Matching Threshold (FAR):"
			'
			'nudQualityThreshold
			'
			Me.nudQualityThreshold.Location = New System.Drawing.Point(146, 16)
			Me.nudQualityThreshold.Maximum = New Decimal(New Integer() {255, 0, 0, 0})
			Me.nudQualityThreshold.Name = "nudQualityThreshold"
			Me.nudQualityThreshold.Size = New System.Drawing.Size(120, 20)
			Me.nudQualityThreshold.TabIndex = 1
			'
			'cbMatchingThreshold
			'
			Me.cbMatchingThreshold.FormattingEnabled = True
			Me.cbMatchingThreshold.Location = New System.Drawing.Point(148, 81)
			Me.cbMatchingThreshold.Name = "cbMatchingThreshold"
			Me.cbMatchingThreshold.Size = New System.Drawing.Size(121, 21)
			Me.cbMatchingThreshold.TabIndex = 3
			'
			'errorProvider1
			'
			Me.errorProvider1.ContainerControl = Me
			'
			'label3
			'
			Me.label3.Location = New System.Drawing.Point(9, 48)
			Me.label3.Name = "label3"
			Me.label3.Size = New System.Drawing.Size(260, 30)
			Me.label3.TabIndex = 7
			Me.label3.Text = "Quality threshold: 0 - 99: low, 100-199: medium, 200 - 255 high."
			'
			'SettingsForm
			'
			Me.AcceptButton = Me.btnOK
			Me.AutoScaleDimensions = New System.Drawing.SizeF(6.0!, 13.0!)
			Me.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font
			Me.CancelButton = Me.btnCancel
			Me.ClientSize = New System.Drawing.Size(281, 144)
			Me.Controls.Add(Me.label3)
			Me.Controls.Add(Me.cbMatchingThreshold)
			Me.Controls.Add(Me.nudQualityThreshold)
			Me.Controls.Add(Me.label2)
			Me.Controls.Add(Me.label1)
			Me.Controls.Add(Me.btnOK)
			Me.Controls.Add(Me.btnCancel)
			Me.FormBorderStyle = System.Windows.Forms.FormBorderStyle.FixedDialog
			Me.MaximizeBox = False
			Me.MinimizeBox = False
			Me.Name = "SettingsForm"
			Me.ShowInTaskbar = False
			Me.Text = "Settings"
			CType(Me.nudQualityThreshold, System.ComponentModel.ISupportInitialize).EndInit()
			CType(Me.errorProvider1, System.ComponentModel.ISupportInitialize).EndInit()
			Me.ResumeLayout(False)
			Me.PerformLayout()

		End Sub

#End Region

		Private btnCancel As System.Windows.Forms.Button
		Private btnOK As System.Windows.Forms.Button
		Private label1 As System.Windows.Forms.Label
		Private label2 As System.Windows.Forms.Label
		Private nudQualityThreshold As System.Windows.Forms.NumericUpDown
		Private cbMatchingThreshold As System.Windows.Forms.ComboBox
		Private errorProvider1 As System.Windows.Forms.ErrorProvider
		Private WithEvents label3 As System.Windows.Forms.Label
	End Class
End Namespace
